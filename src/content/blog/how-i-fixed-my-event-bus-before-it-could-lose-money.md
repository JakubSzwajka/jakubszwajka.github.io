---
title: 'How I Fixed My Event Bus Before It Could Lose Money'
description: 'Remember that time when you thought you built something clever, only to discover it had fundamental flaws? Yeah, that''s exactly what happened with my async even...'
pubDate: 'June 17, 2025'
tags: ['Architecture']
---

Remember that time when you thought you built something clever, only to discover it had fundamental flaws? Yeah, that's exactly what happened with my async event bus.

So I’ve made this post a while ago. [Simple Yet Powerful: Building an In-Memory Async Event Bus in Python](Simple%20Yet%20Powerful%20Building%20an%20In-Memory%20Async%20Ev%2018a2997bdce3805f8bdcfd5ee4431a21.md). And now I’ve changed my mind. I’ve found some serious problems while debugging the app. And I learn something? 

Approach described in this post have some flaws. And we need to talk about them to be more aware about what we are doing. 

Ofc. I encourage you to read this but short TLDR. 

1. We have Fastapi server with async event bus. 
2. Something important in our app happened → `EventBus.publish(event)`  and forget. 
3. We return the response to the user and we don’t care if handler succeed or not. 
4. **fire, forget and don’t care**

For more context I will add that this bus was implemented with sync SQLAlchemy engine. Which is somehow connected also to all the problems I had and how I found them. The second problem was (And here's where it gets interesting…) *the scope of the db transaction*. 

To the point. I will give you a few scenarios that my system was ✨*supporting✨.* 

- There was a meeting between two people. Person A did cancel the meeting and notification system failed. Person B is still waiting cuz there was no notification. Risk? Lets say moderate.
- Someone was in onboarding process. Based on the role he choose, proper stripe account should be created. If I had error in stripe request, This person never got his account onboarded cuz there was no retry to create this account. Risk? A bit higher?
- Person A requested additional payment from Person B. Person B agreed (`EventBus.publish(dispute.resolved)`). Stripe failed because there were funds missing on a card. Risk? **🚨 Money == high risk 🚨**

And other problems. I don’t want to go into this domain details but I’ve noticed that as soon as we leave the ‘happy path’ the problems appears. And they are all the same: 

- **We are loosing events.**
- **We have wrong transaction scope.**

*So the refactor started…* 

1. First I’ve tackled the scope of transaction. I’ve moved the scope from single operation in repo to be a http request scope. So the commit was on the very end. Only when **ALL** operations succeeded.  
2. Then I’ve reworked all methods to be async and switched the SQLAlchemy to be async engine. Still I don’t know why I initially do it sync. 🤷 There was so many problems I’ve found here with lazy loading to be fixed. Basically I found that I was lazy loading half of my app. 

Ok, at this point we’ve tackled the **wrong transaction scope.** Right now if I choose the role of the user, related to stripe connected account, and the second part will fail, the role setup will fail also. And just to be clear. This was the design decision to avoid weird states. 

- user clicks → **Role123** → Response: Ups! we couldn’t setup your account correctly. Please try again.   ****

We don’t have any leftovers because we were in single transaction scope and there was a rollback because of exception. This was something I wanted. 

But now, we not only can loose events but also we are publishing events we shouldn’t! 

Look here. With initial event bus. 

```python
---> transation.open( )

	user.set_role(SUPERHUMAN)
	event_bus.publish(user_role_updated) -> has async consequences 
	stripe.create_connected_account(user) -> Throw Exception  
	
---> transaction.rollback( )
```

We’ve did a rollback but event was published. 😨

## 📤 Outbox Pattern

At this point we have two problems: 

- we might loose events if processing them will fail.
- we might publish and process unwanted events.

So the solution is basically to leverage the fact of the transaction! Instead of throwing events directly to be processed to second thread, we can just… save them 🤷. 

Come here I will show you my outbox. Just a simple table that stores events:

```python
class EventOutboxModel(BaseModel):
    __tablename__ = 'events_outbox'

    class EventStatus(enum.StrEnum):
        PENDING = 'pending'
        PROCESSED = 'processed'
        FAILED = 'failed'

    event_type: Mapped[str] = mapped_column(nullable=False)
    entity_id: Mapped[str] = mapped_column(nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(nullable=False)
    status: Mapped[EventStatus] = mapped_column(nullable=False, default=EventStatus.PENDING)
    user_id: Mapped[Optional[str]] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), nullable=True)

```

The fix was simple but non-obvious. Instead of firing events immediately, I started storing them:. So now what we need to change is `EventBus.publish(event)`. Previously it was like this: 

```python
@dataclass
class Event:
    event_type: str

class SimpleEventBus:
    def __init__(self):
        self._handlers: Dict[str, List[Callable]] = {}
        self._executor = ThreadPoolExecutor(max_workers=4)

    def publish(self, event: Event) -> None:
        if event.event_type in self._handlers:
            for handler in self._handlers[event.event_type]:
                # Fire-and-forget execution
                self._executor.submit(handler, event)
```

What I needed to change is the session I was passing from the controller downstream. 

```python
from sqlalchemy.ext.asyncio import AsyncSession

@dataclass
class Event:
    event_type: str

class EventBus:
    async def publish(self, event: Event, db: AsyncSession) -> None:
        await self.outbox_repo.save(event, db)
```

Lets look one more time here now

```python
---> transation.open( )

	user.set_role(SUPERHUMAN)
	event_bus.publis(user_role_updated, transaction) -> not yet published 
	stripe.create_connected_account(user) -> Throw Exception  
	
---> transaction.rollback( )
```

At this point events where not written to the outbox! 

What does it mean? We are not publishing unwanted events. No consequences that we’ve failed after publish. Also we store **ALL** the events that we want to publish. So even if the event handler will fail, we can still process them one more time before switching their status to **PROCESSED.** 

- ✅ We have wrong transaction scope. Leftovers after failed operations.
- ✅ We might loose events if processing them will fail.
- ✅ We might publish and process unwanted events.

## Worker

Obviously there is missing part about the worker. So we have this table of events to be processed. Periodically we can fetch them and ask `EventBus` to point the correct event handler by `event_type`. 
That’s it. I’ve used FastApi background task for it. 

```python
async def _loop():
    while True:
        try:
            events_count = await EventBus.flush_outbox()
        except Exception as exc:
            _logger.error(f'outbox loop error: {exc}')
        await asyncio.sleep(0.2) # Check every 200ms - fast enough for real-time feel"

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(_loop(), name='outbox-dispatcher')
    yield

@classmethod
async def flush_outbox(cls, batch_size: int = 100):
    count = 0
    events_to_process = []
    async with SessionLocalAsync() as session:
        events_to_process = await cls._repo.fetch_pending(session, batch_size)

    for event in events_to_process:
        for handler in cls._handlers[event.event_type]:
            try:
                async with SessionLocalAsync() as session:
                    async with session.begin():
                        await handler(e, session)
                        await cls.repo.mark_as_sent(event.id, session)
            except Exception as exc:
                cls._logger.error(f'Error handling event: {exc}')
                continue

```

## Worker monitoring

Also one more pros I would say of this approach. With big traffic we can now monitor if we are falling behind with event processing. Look here. 

```python
# Simple monitoring query I use:
SELECT COUNT(*) FROM events_outbox WHERE status = 'pending';
# If this keeps growing, something's broken 
```

I throw this into a simple dashboard. If I see the number climbing, I know either:

- My handlers are too slow
- I need more workers
- Something's broken in the processing loop

Before? I had no clue if events were getting lost. Now I can actually see the queue building up.

And this story more or less ends here right now. From my perspective? Easier to test, easier to compose, more predictable… 

But..

## 🚨 Risks and problems

Now, this solution isn't perfect - let me show you what's still broken. I can see two of them right now. 

1. Two workers picks the same event to process. So lets say you are scaling up and suddenly two processes can pick the same event to process and publish. That means we have **At least one delivery**. Maybe more? 
    
    Quick fix I can think of is to create some kind of lock on events we are processing. But this is not covered here. 
    
2. What if we have multiple handlers of the same events. `event.status=PROCESSES` means who processed? First? Second? All of them? 
    
    And this is probably the biggest issue here. If we fail on processing in one handler and second will succeed we break **At least one delivery.** 
    
    From the publisher perspective (outbox) we did our job. And here comes the role of the consumer. Solution? Maybe next blog post will be about inbox pattern? 
    

Anyway, that's how I stopped losing events before they could cost me real money. Pretty sure there are more edge cases waiting to bite me…

## Want more? 🤔

Look, I get it. You're here because you had a specific problem and needed a solution that **actually works**. 
That's exactly why I started this blog → practical dev solutions, tested in production, delivered ✨**randomly**✨.

‣ 

- ✅ Code snippets that solve real problems  
- ✅ "Aha!" moments from my coding adventures  
- ✅ Tools and tricks I actually use