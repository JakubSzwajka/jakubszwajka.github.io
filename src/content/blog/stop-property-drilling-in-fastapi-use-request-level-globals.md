---
title: 'Stop Property Drilling in FastAPI: Use Request-Level Globals'
description: 'So in my application, I was very happy with the pattern I figured out. I knew it had some flaws like property drilling through the whole application and through...'
pubDate: 'September 21, 2025'
tags: ['HowTo', 'Patterns', 'Python']
---

So in my application, I was very happy with the pattern I figured out. I knew it had some flaws like property drilling through the whole application and through multiple layers starting basically from controllers in FastAPI. I was creating the context object for the user on the route level, the same for the database session etc. I was basically passing those down through all of the layers, down to policy in domain layer just to answer "Am I allowed to do something or not".

So my code looked like this..

## Before: Property drilling nightmare 🙄



Notice how `context` is passed through multiple layers just to be used in the final policy check. This is classic property drilling - passing props through components that don't need them, just so deeply nested components can access them.



```python
# controller.py
@router.post("/projects")
async def create_project(
    data: ProjectRequest,
    db: Session = Depends(get_db),
    context: Context = Depends(get_context)
):
    return await project_service.create_project(data, context)

# services/project_service.py
async def create_project(data: ProjectRequest, context: Context):
    # Do some business logic
    await can_create_project(context).unwrap()  # <-- this throws exception if forbidden
    return await project_repository.create(data, context)

async def can_create_project(context: Context) -> Result[bool, BaseError]:
    if not await project_policy.check_create_permission(context):
        return Result.err(
            error=BadRequestError(
                type=ErrorType.PROJECT_CREATION_FORBIDDEN,
                description='User lacks permission to create projects',
            )
        )
    return Result.ok(True)

# repositories/project_repository.py
async def create(data: ProjectRequest, context: Context):
    # Still dragging context around...
    project = Project(**data.dict())
    context.db.add(project)
    # More drilling!
    await audit_log.log_creation(project, context)  
    await event_bus.publish(ProjectCreated(project, context))
    return project

# policies/project_policy.py
class ProjectPolicy:
    def check_create_permission(self, context: Context):
        # FINALLY! We actually use the context here
        if context.user.role == "admin":
            return True
        if context.user.organization.plan == "enterprise":
            return True
        return False
```

## The Inspiration

And then somehow I bumped into the DHH playlist on YouTube about [Writing Software Well](https://www.youtube.com/playlist?list=PL3m89j0mV0pdNAg6x9oq6S8Qz_4C-yuwj). He mentioned globals and actually the code was from Basecamp and it was in Ruby. But he showed a very important concept of `Current` in Ruby.

**Just a disclaimer**: I don't know how exactly the current looked like in Ruby and how it works. But I tried to replicate the same in my application so that I can remove a bunch of code and basically make testing easier.

## The Solution

Here's the thing. The idea is that on the very beginning of the request, because we are thinking about the whole concept on the request level, not global as in the whole runtime, but only on the request level. Because a single request can be basically assigned to a single user.

So the idea is that we're creating something that is called [context variable](https://docs.python.org/3/library/contextvars.html) in Python on the very beginning of the request.

```python
# context.py
from contextvars import ContextVar
from typing import Optional
from pydantic import BaseModel
from fastapi import Request

class Context(BaseModel):
    """
    Our 'current' context - similar to Ruby's Current pattern.
    Contains authenticated user and commonly used references.
    """
    issuer_id: str
    issuer_role: UserRole
    issuer_email: str
    issuer_status: UserStatus
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    organization_member_role: Optional[OrganizationMemberRole] = None
    organization_member_status: Optional[OrganizationMemberStatus] = None
    feature_flags: dict[ConfigKey, FeatureFlagConfig] = {}
    config: UserConfig
    client_info: dict = {}
    
    def is_admin(self) -> bool:
        return self.issuer_role == UserRole.ADMIN
    
    def has_feature_flag(self, key: ConfigKey) -> bool:
        return self.config.check_ff(key)
    
    def verify_is_admin(self) -> None:
        if self.issuer_role != UserRole.ADMIN:
            raise ForbiddenError(
                type=ErrorType.UNAUTHORIZED,
                description='You are not authorized to access this resource',
            )
    
    @classmethod
    def for_user(cls, user: UserSchema) -> Self:
        organization_id = user.organization.id if user.organization else None
        organization_member_role = user.organization.role if user.organization else None
        return cls(
            issuer_id=user.id,
            issuer_role=user.role,
            issuer_status=user.status,
            issuer_email=user.email,
            organization_id=organization_id,
            organization_name=user.organization.name if user.organization else None,
            organization_member_role=organization_member_role,
            config=UserConfig(),
        )

class _ContextAttributes:
    _context: ContextVar[Optional[Context]] = ContextVar('current_context', default=None)
    
    @property
    def context(self) -> Context:
        ctx = self._context.get()
        if ctx is None:
            raise RuntimeError('No context available - not in request scope')
        return ctx
    
    @property
    def user_id(self) -> str:
        return self.context.issuer_id
    
    def set(self, context: Context):
        self._context.set(context)
    
    def clear(self):
        self._context.set(None)

# The global Current instance
Current = _ContextAttributes()
```

And this whole class, the instance of it, is set as a context variable in Python. And why context variable? If we use async FastAPI, the context variables are thread-safe. So if the same instance will asynchronously pick up another process, another request, we will not override this global. That's why.

Context variables in Python are specifically designed for async/concurrent code. Each async task gets its own copy of the context, preventing race conditions and data leakage between requests. The `Current` singleton pattern wraps the ContextVar to provide a clean interface.

Now let's see how this simplifies our code:

## After: Clean and simple 🎉

```python
# middleware.py
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class CurrentContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        user = await get_current_user_from_request(request)
        context = Context.for_user(user)
        context.set_client_info(request)
        
        Current.set(context)
        
        try:
            response = await call_next(request)
            return response
        finally:
            Current.clear()

# controller.py
@router.post("/projects")
async def create_project(data: ProjectRequest):
    return await project_service.create_project(data)

# services/project_service.py
async def create_project(data: ProjectRequest):
    await can_create_project().unwrap()  # Still throws if forbidden
    return await project_repository.create(data)

async def can_create_project() -> Result[bool, BaseError]:
    if not await project_policy.check_create_permission():
        return Result.err(
            error=BadRequestError(
                type=ErrorType.PROJECT_CREATION_FORBIDDEN,
                description='User lacks permission to create projects',
            )
        )
    return Result.ok(True)

# repositories/project_repository.py
async def create(data: ProjectRequest):
    context = Current.context
    
    project = Project(**data.dict())
    context.db_session.add(project)
    
    await audit_log.log_creation(project)  
    await event_bus.publish(ProjectCreated(project))
    return project

# policies/project_policy.py
class ProjectPolicy:
    def check_create_permission(self):
        # Just access the current context when needed!
        context = Current.context
        
        if context.is_admin():
            return True
        if context.has_feature_flag(ConfigKey.ENTERPRISE_PROJECTS):
            return True
        if context.organization_member_role == OrganizationMemberRole.OWNER:
            return True
        return False
```

The easy thing to do right now is basically to stop passing this context, because we already set it. And just try to access this when needed. When it's needed on the very end in the policies. When just basically checking who is the person who is asking. It's like 10% of the code. So we don't need to drill it down to the very bottom through all the layers.

## Conclusion

After implementing this pattern:

- **40% less code** in service and repository layers
- **Testing setup reduced by half** - no more mock chains

And that's basically it. Simple trick that basically removed a lot of code, its maintainable, made everything easier, hiding some complexity behind some context magic. 

And thanks, DHH, for [this playlist](https://www.youtube.com/playlist?list=PL3m89j0mV0pdNAg6x9oq6S8Qz_4C-yuwj). I think the whole series is worth watching.