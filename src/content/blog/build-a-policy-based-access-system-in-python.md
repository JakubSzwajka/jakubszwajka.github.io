---
title: 'Build a Policy-Based Access System in Python'
description: 'Last week, I was staring at permission checks scattered across my API codebase. You know the feeling - nested if-statements everywhere, duplicated logic, and th...'
pubDate: 'June 7, 2025'
tags: ['Patterns']
---

Last week, I was staring at permission checks scattered across my API codebase. You know the feeling - nested if-statements everywhere, duplicated logic, and that voice saying "there's gotta be a better way.” 

- I’m allowed to query `/user/123` if:
    - I’m user with id `123`.
    - I’m Admin.
    - I’m Admin of organisation to which user `123` belongs to.
- I’m allowed to query  `/meeting/123`
    - When I’m admin
    - When I’m participant of `/meeting/123`
    - When I’m BillingAdmin in organisation to which one of participants belongs to.

So as you see there is like a plenty of examples which are pretty simple to implement. I just want to avoid things like this across the whole codebase. 

```python
if context.issuer_id != user_id:
	raise ForbiddenError('Go away!') 
```

One more thing for context. This was built to be applied when querying for the data. Not when performing operations. Performing actions is much more complicated and implemented in different way. Can describe this if needed. 

## My main requirements

- I can easily compose different rules.
- I can easily add this to existing codebase.
- **I need to fail fast. So reject query as soon as possible.**

## End Goal Overview

This is what I was looking for. Easily apply rules that: 

- this method can be accessed if `user/123`  is asking for himself.
- this method can be accessed by Admin
- this method can be accessed by Admin of the organisation that `user/123` belongs to.

```python
@require_any([
    RequireIssuerIdPolicy("user_id"),
    RequireAnyRolePolicy([UserRole.ADMIN]),
    RequireOrganizationAdminPolicy()
])
def get_user_profile(self, user_id: str, context: Context) -> UserProfile:
    return self.user_repo.get_profile(user_id)
```

The whole point here is that in single place we can easily add checks that require no data and require the result of the function. So the decorator must be smart enough to manage them all. 

## Implementation details

Lets go with implementation. Here is one nice thing. The key assumption was that across the whole app we are passing context object which is prepared in FastApi middleware based on JWT token. It has user data. So by default, for all endpoints we can check if user is actually at least active.  

### Decorators

```python
def require_any(policies: list[AccessPolicy]):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            context: Context | None = kwargs.get('context')
            if not context:
                raise ValueError("Context must be provided as a 'context' keyword argument")

            if context.issuer_status in [UserStatus.DEACTIVATED, UserStatus.PENDING_APPROVAL]:
                raise ForbiddenError(ErrorType.FORBIDDEN, 'Access denied: user is deactivated or pending approval')

            post_checks = []

            # Try all pre-checks first
            pre_passed = []

            for policy in policies:
                if policy.is_post_check():
                    post_checks.append(policy)
                else:
                    try:
                        policy.check(context, kwargs)
                        pre_passed.append(policy)
                    except ForbiddenError:
                        continue

            result = func(*args, **kwargs)
            if pre_passed or not policies:
                return result

            # If none of pre passed, try post checks
            for policy in post_checks:
                try:
                    policy.check_post(context, result, kwargs)
                    return result
                except ForbiddenError:
                    continue

            raise ForbiddenError(ErrorType.FORBIDDEN, 'Access denied: no policy passed (require_any)')
        return wrapper
    return decorator

```

### Policies

```python
class AccessPolicy(ABC):
    def is_post_check(self) -> bool:
        return False

    @abstractmethod
    def check(self, context: Context, kwargs: dict):
        pass

    def check_post(self, context: Context, result: object, kwargs: dict):
        raise NotImplementedError('Not a post-execution policy')

class PostAccessPolicy(AccessPolicy):
    def is_post_check(self) -> bool:
        return True

    def check(self, context: Context, kwargs: dict):
        raise NotImplementedError('Post check uses check_post() instead')

class RequireIssuerIdPolicy(AccessPolicy):
    def __init__(self, user_id_arg: str = 'user_id'):
        self.user_id_arg = user_id_arg

    def check(self, context: Context, kwargs: dict):
        user_id = kwargs.get(self.user_id_arg)
        if user_id != context.issuer_id:
            raise ForbiddenError(ErrorType.FORBIDDEN, 'Access denied')
            
class RequireOrganizationAdminPolicy(PostAccessPolicy):
    # Check if the issuer is an organization admin and the resource is in the same organization.
    def __init__(self, organization_id_arg: str = 'organization.id'):
        self.organization_id_arg = organization_id_arg

    def check_post(self, context: Context, result: object, kwargs: dict):
        resource_organization_id = result
        for step in self.organization_id_arg.split('.'):
            resource_organization_id = getattr(resource_organization_id, step)
        
        if context.organization_member_role != OrganizationMemberRole.ADMIN:
				    raise ForbiddenError(ErrorType.FORBIDDEN, 'Access denied: not organization admin')
				if resource_organization_id != context.organization_id:
				    raise ForbiddenError(ErrorType.FORBIDDEN, 'Access denied: different organization')

class RequireAnyRolePolicy(AccessPolicy):
    def __init__(self, roles: list[UserRole]):
        self.roles = roles

    def check(self, context: Context, kwargs: dict):
        if context.issuer_role not in self.roles:
            raise ForbiddenError(ErrorType.FORBIDDEN, f'Access denied: requires one of {self.roles}')

```

## **Why Post-Execution Checks And Pre-Execution Checks?**

**Pre-execution checks** run before your function executes. They will let you reject unauthorized requests before expensive database queries, saving both time and resources.. These are perfect for simple validations like:

- "Is user an admin?"
- "Does the user ID match the requester?"

**Post-execution checks** run after fetching the resource. Some access decisions require data only available after fetching the resource. For example:

- "Is the user a participant in this specific meeting?"
- "Does the user belong to the same organization as this booking?"

## **Problems Solved**

This system tackles several common pain points in API access control:

- **Scattered Permission Logic**: No more if-statements buried throughout your business logic
- **Code Duplication**: Write once, reuse everywhere - no copy-pasting permission checks
- **Resource-Dependent Access**: Handle permissions that depend on fetched data (like "is user a meeting participant?")
- **Maintainability**: Easy to modify, test, and extend without touching business logic

---

## Want more solutions like this? 🤔

Look, I get it. You're here because you had a specific problem and needed a solution that **actually works**. 
That's exactly why I started this blog → practical dev solutions, tested in production, delivered ✨**randomly**✨.

‣ 

- ✅ Code snippets that solve real problems  
- ✅ "Aha!" moments from my coding adventures  
- ✅ Tools and tricks I actually use