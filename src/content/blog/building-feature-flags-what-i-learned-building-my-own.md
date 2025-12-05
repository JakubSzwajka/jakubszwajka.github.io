---
title: 'Building Feature Flags: What I Learned Building My Own'
description: 'So I''ve been working on this project where the pace of development was much faster than our QA process. You know that feeling when you''re shipping code daily, b...'
pubDate: 'September 27, 2025'
tags: ['Architecture', 'Patterns', 'Python']
---

So I've been working on this project where the pace of development was much faster than our QA process. You know that feeling when you're shipping code daily, but your QA and client acceptance testing happens in batches? Yeah, that was my reality.

The problem hit me hard when I realized I was avoiding deploying changes I'd written a week or two ago. **What happens when something breaks after tests, and I've already merged other stuff?** Do I rollback everything? Cherry-pick commits? Deal with merge conflicts while the production is on fire?

Feature flags seemed like the answer to most of these headaches.

But here's the real kicker - I also wanted certain features to be configurable on the user level. Not just global on/off switches, but **user-specific configuration**. Like, I don't want to change the main behavior for all users, just for specific testers.

That's when I realized I needed two levels: **global and user-specific control**.

---

## 🎯 Why This Actually Mattered

Let me give you some real examples that'll make this concrete:

**Payment Testing Nightmare** 🤑

We wanted to test payments in production. The minimal hourly rate was set to $60. But I don't want to pay that much just to test payment flows (possibly several times). So I built user-level config to set min hourly rate. Now I can set it to $1 for testing. *This is more like dynamic config than feature flags, but same mechanism.*

**New Credits System** 💳

We introduced in-app credits, so payments weren't just Stripe anymore. Since I treat money as the most critical part of any app, I wanted an instant **kill switch**. Turn it off when things go wrong, turn it on when we're confident.

**The Rollback Hell** 🔥

You're always more prone to bugs when you're in a hurry. Release to prod, bug happens, you skipped some config, something works differently. You need to rollback, but you've already merged a bunch of changes. Merge conflicts during a production incident? **That's a recipe for more mistakes.**

With feature flags? Just flip the switch. **No release process needed.**

---

## 🙄 The Problem: Release Hell

The main problem of not having feature flags isn't that you're less flexible. **The problem is that your release process is tightly coupled to your deployment process.**

To change anything, you need to release a totally different version of your code. That means going through the entire testing process. **Time is money, and this was burning both.**

Here's my daily reality: I want to release code daily. I'm working on Feature A - let's say external calendar integration that impacts user availability. Since availability is core to the business process, it's critical.

**There's no safe option to release each commit before completing this feature.** So I stack all changes, finish everything, push the deploy button, and pray it doesn't blow up.

What if it does blow up?

```
Code changes → Commits → Testing → Release (DEV → TEST → PROD) → Back to square one
```

Here's the alternative I built:

**Hide the impact behind feature flags from day one.**

```python
def is_available(self, user_id, datetime):
    if feature_flag_check('EXTERNAL_CALENDAR_INTEGRATION'):
        return check_availability_in_external_calendar(user_id, datetime)
    
    return check_basic_availability(user_id, datetime)
```

From the very first commit, I can push to PROD even if this function looks like:

```python
def check_availability_in_external_calendar(user_id, datetime):
    return True  # TODO: implement actual logic
```

Because I'll just set `EXTERNAL_CALENDAR_INTEGRATION` to `False`.

**Next step?** Switch it to `True` for a specific user, test it, and if it blows up - flip it back to `False` instantly. **No deployment, no CI, no QA process. Just faster and safer.**

---

## 💡 My Solution: Keep It Simple, Keep It Fast

At this point, let's talk about how I built this. It's a simple mechanism to start with. You could use external solutions, but let's build a custom one that actually works.

**What you need:**

- Storage for feature flags
- Admin panel for CRUD operations
- Tools to use them in your code

In my app, I'm using an in-memory event bus and the [context pattern I described here](Stop%20Property%20Drilling%20in%20FastAPI%20Use%20Request-Leve%202752997bdce380d4bac3fe95838e1943.md). The key insight: **Is a feature flag on/off? Depends on who's asking.**

I store flags in a request-global Context variable. For each request, when building context, I fetch all feature flags enabled globally and those for the specific user.

```python
class FeatureFlagsModel(BaseModel):
    __tablename__ = 'feature_flags'
    __table_args__ = (
        UniqueConstraint('key', 'user_id', name='uq_feature_flag_key_user'),
        Index('ix_feature_flag_user_id', 'user_id'),
        Index('ix_feature_flag_key', 'key'),
    )

    key: Mapped[ConfigKey] = mapped_column(String, nullable=False)
    enabled: Mapped[bool] = mapped_column(nullable=False, default=False)
    value: Mapped[Optional[str]] = mapped_column(nullable=True)
    
    user_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey('[users.id](http://users.id)', ondelete='CASCADE'), 
        nullable=True
    )
    user: Mapped[Optional['UserModel']] = relationship(back_populates='configuration')
    
    enabled_globally: Mapped[bool] = mapped_column(nullable=False, default=False)
```

The check logic is beautifully simple:

```python
def check_ff(self, key: ConfigKey) -> bool:
    if key in self.feature_flags:
        flag = self.feature_flags[key]
        
        # User-specific flag overrides global setting
        if flag.user_id is not None:
            return flag.enabled
            
        # Global flag
        return flag.enabled_globally
    
    return False
```

**That's it.** User-specific flags override global ones. Clean precedence, predictable behavior.

---

## 🎉 What I Actually Built (The Honest Truth)

Let me be real with you - I called it "feature flags" but I mostly built a **dynamic configuration system**.

Here are the 3 configs I actually use in production:

1. **`MINIMUM_TIME_REQUIRED_BEFORE_BOOKING_IN_HOURS`** - Controls booking lead time. We have it 24h but for testing it can be 0. 
2. **`CAPTIONER_HOURLY_RATE_MIN`** - Minimum allowed hourly rate
3. **`CAPTIONER_HOURLY_RATE_MAX`** - Maximum allowed hourly rate

These aren't boolean flags - they're **typed configuration values** that I can change without deployments.

```python
# In my booking policy
min_booking_time = now + timedelta(
    hours=Current.context.config.minimum_time_required_before_booking_in_hours
)

# In rate validation  
if not (config.captioner_hourly_rate_min <= rate <= config.captioner_hourly_rate_max):
    raise ValidationError("Rate outside allowed range")
```

## 💭 Lessons & What's Next

**Build vs Buy:** Started custom because it's faster and not that much to implement.

**The Missing TTL Problem:** Here's something I should have implemented from day one - **automatic flag expiration**. Feature flags are meant to be temporary. Without TTL, they become permanent technical debt. You end up with dozens of old flags cluttering your codebase and database.

In a real feature flag system, every flag should have an expiration date. When flags expire, they should either:

- Auto-disable and alert the team
- Force a code cleanup decision
- Remove themselves entirely

This prevents the "flag graveyard" problem where you have 50+ flags and nobody remembers what half of them do.

**What I'd Add Next:**

- TTL implementation with automated cleanup
- Rename to "dynamic configuration with feature toggling"

---

## 🤔 Your Turn

What's your configuration management looking like? Are you still doing deployments to change a single value? Or have you built something similar?

I'm curious about your approach to user-specific configuration and how you handle the performance implications.

**Drop a comment** - I'd love to hear about your feature flag wins and disasters.