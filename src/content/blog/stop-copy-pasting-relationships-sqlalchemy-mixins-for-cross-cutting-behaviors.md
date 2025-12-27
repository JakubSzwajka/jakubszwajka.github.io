---
title: 'Stop Copy-Pasting Relationships: SQLAlchemy Mixins for Cross-Cutting Behaviors'
description: 'You know that feeling when you need to add the same feature to multiple models in your app? Like, you want several different entities to have comments, or alerts, or notifications...'
pubDate: 'December 22, 2025'
tags: ['Python', 'SQLAlchemy', 'Patterns', 'HowTo']
---

You know that feeling when you need to add the same feature to multiple models in your app? Like, you want several different entities to have comments, or alerts, or notifications, and you're sitting there thinking "do I really need to copy-paste this relationship code everywhere?"
Yeah, me too.
Rails developers have been laughing at us with their ActiveRecord Concerns for years. But here's the thing – **SQLAlchemy has mixins, and they're actually pretty cool** when you use them right.
Let me show you TWO real examples from a production booking platform where we needed different behaviors that could work with ANY entity in the database.

## The Problem: Cross-Cutting Behaviors
Picture this: you're building a booking platform. Product comes to you with two requests:
**Request 1**: "We need a way to track alerts – missing documents on bookings, incomplete onboarding on users, expired contracts, failed payments. The system should automatically create and resolve these."
**Request 2**: "Admins want to leave notes on things – bookings, user profiles, captioner profiles. You know, internal context that helps us manage accounts."
The naive approach? Create separate tables for each combination: `booking_alerts`, `user_alerts`, `booking_notes`, `user_notes`, `captioner_profile_notes`... yeah, no thanks.
The slightly better but still annoying approach? Manually add the same relationship code to every model. Copy, paste, hope you don't miss anything when you add the next entity type.

**There's a better way.**

## The Solution: Polymorphic Relationships with Mixins
Here's the idea: create ONE table per behavior that can reference any entity type, then use a mixin to add that behavior to any model that needs it.

We'll build two examples:
1. **Alerts** – system-generated warnings that get resolved
2. **Notes** – admin-created comments with audit trails
Both use the same polymorphic pattern, but configured differently for their specific needs.

## Example 1: System Alerts

### The Alert Model
First, we need a table that can store alerts about different types of entities:
```python
class AlertModel(BaseModel):
    __tablename__ = 'alerts'

    about_id: Mapped[str]              # ID of the entity
    about_type: Mapped[AlertAboutType]  # Type: BOOKING, USER, etc.
    alert_type: Mapped[AlertType]       # Specific alert type
    resolved: Mapped[bool]              # Is it resolved?
    resolved_at: Mapped[Optional[datetime]]

    def resolve(self):
        self.resolved = True
        self.resolved_at =
```
Notice the `about_id` + `about_type` combo? That's our polymorphic key. It lets ONE table reference many different entity types.
### The Alertable Mixin
Now here's where it gets interesting. We create a mixin that any model can use:
```python
class AlertableMixin:
    @declared_attr
    def alerts(self) -> Mapped[list[AlertModel]]:
        return relationship(
            'AlertModel',
            primaryjoin=lambda: and_(
                AlertModel.about_type == literal(
                    getattr(self, '__name__').upper().replace('MODEL', '')
                ),
                foreign(AlertModel.about_id) == getattr(self, 'id'),
            ),
            viewonly=True,
            lazy='raise',  # Force explicit loading
        )

    def create_alert(self, *, alert_type: AlertType) -> AlertModel:
        """Create a new alert for this entity"""
        return AlertModel(
            about_type=self.__class__.__name__.upper().replace('MODEL', ''),
            about_id=getattr(self, 'id'),
            alert_type=alert_type,
        )

    def unresolved_alerts(self) -> list[AlertModel]:
        """Filter already-loaded alerts to unresolved ones"""
        return [a for a in self.alerts if not a.resolved]

    def has_unresolved_alert(self, alert_type: AlertType) -> bool:
        """Check if a specific alert type exists and is unresolved"""
        return any(
            a for a in self.alerts
            if a.alert_type == alert_type and not a.resolved
        )
```
**What's happening here?**
- `@declared_attr` creates the relationship dynamically at class definition time
- The `primaryjoin` extracts the entity type from the model name (`UserModel` → `USER`)
- `lazy='raise'` prevents N+1 queries – you MUST explicitly load alerts
- Helper methods encapsulate common operations
### Using the Alert Mixin
```python
class UserModel(BaseModel, AlertableMixin):
    __tablename__ = 'users'
    email: Mapped[str]
    # ... other fields

class BookingModel(BaseModel, AlertableMixin):
    __tablename__ = 'bookings'
    status: Mapped[str]
    # ... other fields
```
Done. Both models now have alerts.
```python
# Create an alert
booking = await booking_repo.get_booking_by_id(booking_id)
alert = booking.create_alert(
    alert_type=
```
## Example 2: Admin Notes
Now let's look at a different behavior with different requirements. Admins wanted to leave internal notes on various entities throughout the admin panel.
### The Note Model
```python
class NoteModel(BaseModel):
    __tablename__ = 'notes'

    about_id: Mapped[str] = mapped_column(String, nullable=False)
    about_type: Mapped[NoteAboutType] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(String, nullable=False)

    # Track who created the note
    admin_id: Mapped[str] = mapped_column(ForeignKey('
```
Same polymorphic pattern, but with audit fields and a relationship to track who created the note.
### The Noteable Mixin
```python
class NoteableMixin:
    @declared_attr
    def notes(self) -> Mapped[list[NoteModel]]:
        return relationship(
            'NoteModel',
            primaryjoin=lambda: and_(
                NoteModel.about_type == literal(
                    getattr(self, '__name__').upper().replace('MODEL', '')
                ),
                foreign(NoteModel.about_id) == getattr(self, 'id'),
            ),
            viewonly=True,
            lazy='select',  # Auto-load when accessed
            order_by='desc(NoteModel.created_at)',  # Most recent first
        )

    def create_note(self, *, content: str, admin_id: str) -> NoteModel:
        return NoteModel(
            about_type=self.__class__.__name__.upper().replace('MODEL', ''),
            about_id=getattr(self, 'id'),
            content=content,
            admin_id=admin_id,
        )
```
**Notice the differences?**
- `lazy='select'` instead of `lazy='raise'` – notes are simpler, auto-loading is fine
- `order_by='desc(NoteModel.created_at)'` – always get most recent notes first
- `create_note()` requires `admin_id` for audit trail
### Using the Note Mixin
```python
class BookingModel(BaseModel, AlertableMixin, NoteableMixin):
    __tablename__ = 'bookings'
    # ... fields

class CaptionerProfileModel(BaseModel, NoteableMixin):
    __tablename__ = 'captioner_profiles'
    # ... fields
```
See that? `BookingModel` uses BOTH mixins. It can have both alerts and notes.
```python
# Admin leaves a note
booking = await booking_repo.get_booking_by_id(booking_id)
note = booking.create_note(
    content="Customer called about missing invoice",
    admin_id=current_
```
## Configuration Choices Matter
Both mixins use the same polymorphic pattern, but they're configured differently because they have different needs:
<table header-row="true">
<tr>
<td>Feature</td>
<td>Alerts</td>
<td>Notes</td>
</tr>
<tr>
<td>**lazy**</td>
<td>`'raise'`</td>
<td>`'select'`</td>
</tr>
<tr>
<td>**Why?**</td>
<td>Performance-critical queries, explicit loading prevents N+1</td>
<td>Simple display, auto-loading is fine</td>
</tr>
<tr>
<td>**order_by**</td>
<td>None</td>
<td>`desc(created_at)`</td>
</tr>
<tr>
<td>**Why?**</td>
<td>Filter by resolved status instead</td>
<td>Always show most recent notes first</td>
</tr>
<tr>
<td>**Audit trail**</td>
<td>Just resolved_at</td>
<td>Full created_at, updated_at, admin relationship</td>
</tr>
<tr>
<td>**Why?**</td>
<td>System-generated, less important who resolved</td>
<td>Need to know who said what when</td>
</tr>
</table>
This flexibility is the power of the mixin pattern. Same structure, different configuration.
## Other Behaviors This Pattern Unlocks
Once you see this pattern, you start seeing it everywhere. Here are 5 more real-world use cases where the same polymorphic mixin approach works perfectly:
### 1. AttachableMixin – File Uploads on Anything
```python
class AttachmentModel(BaseModel):
    __tablename__ = 'attachments'

    about_id: Mapped[str]
    about_type: Mapped[AttachmentAboutType]
    file_name: Mapped[str]
    file_url: Mapped[str]  # S3 URL or similar
    file_type: Mapped[str]  # 'pdf', 'image', 'doc'
    file_size: Mapped[int]
    uploaded_by_id: Mapped[str] = mapped_column(ForeignKey('
```
**Use case**: Support tickets need attachments, invoices need attachments, user profiles need attachments. One table, one mixin, infinite attachment points.
### 2. TaggableMixin – Flexible Tagging System
```python
class TagModel(BaseModel):
    __tablename__ = 'tags'

    tagged_id: Mapped[str]
    tagged_type: Mapped[TaggedType]
    tag_name: Mapped[str]  # 'urgent', 'vip', 'bug', 'feature'
    color: Mapped[Optional[str]]  # For UI display
    created_by_id: Mapped[str]
```
**Use case**: Tag projects, tasks, customers, support tickets, blog posts. Instead of separate tagging tables for each entity, one unified system. Great for filtering, search, and cross-entity organization.
### 3. AuditableMixin – Activity Log for Everything
```python
class ActivityLogModel(BaseModel):
    __tablename__ = 'activity_logs'

    entity_id: Mapped[str]
    entity_type: Mapped[EntityType]
    action: Mapped[str]  # 'created', 'updated', 'deleted', 'viewed'
    user_id: Mapped[str]
    changes: Mapped[Optional[dict]]  # JSON field with before/after
    timestamp: Mapped[datetime]
    ip_address: Mapped[Optional[str]]
```
**Use case**: Compliance and audit trails. Track who did what to bookings, payments, user records, contracts. One unified timeline for all entity changes. GDPR and SOC2 auditors love this.
### 4. FavoritableMixin – User Bookmarks/Saves
```python
class FavoriteModel(BaseModel):
    __tablename__ = 'favorites'

    favorited_id: Mapped[str]
    favorited_type: Mapped[FavoriteType]
    user_id: Mapped[str] = mapped_column(ForeignKey('
```
**Use case**: Users can favorite articles, products, search queries, dashboard views, reports. Build a "My Favorites" page that shows everything they've saved, regardless of type. One query, heterogeneous results.
### 5. ReviewableMixin – Reviews and Ratings
```python
class ReviewModel(BaseModel):
    __tablename__ = 'reviews'

    reviewed_id: Mapped[str]
    reviewed_type: Mapped[ReviewType]
    reviewer_id: Mapped[str] = mapped_column(ForeignKey('
```
**Use case**: Marketplace where users review products, sellers, AND delivery services. One review system, different entity types. Easy to build aggregate ratings and "most helpful" sorting.
---
All of these follow the same pattern: polymorphic key (`\{entity\}_id` + `\{entity\}_type`) plus behavior-specific fields. The mixin handles the relationship boilerplate, you just add the business logic.
## Why This Approach Works
**Reusability**: Add `AlertableMixin` or `NoteableMixin` to any model. No code duplication.
**Type Safety**: Enums give you autocomplete and catch typos at development time.
**Composability**: Mix and match behaviors on the same model. Need alerts AND notes? Add both mixins.
**Maintainability**: Behavior logic lives in ONE place. Need to change how notes work? Change the mixin.
**Scalability**: One table per behavior, infinite entity types. Want to add alerts to a new entity? Just add the mixin to your model class. No migration needed. The `alerts` table already handles any entity type. This is huge when you're iterating fast.
**Zero Migration Tax**: This is worth emphasizing. With traditional approaches, adding the same behavior to a new entity means creating a new table (`contract_alerts`) and running a migration. With this pattern? Add one line (`AlertableMixin`) to your model. Done. The polymorphic table already supports it.
## When NOT to Use This
Don't use this pattern if:
- You only have ONE entity type that needs the behavior (just use a normal relationship)
- Your behaviors are complex and entity-specific (inheritance might be better)
- You're adding too many mixins to one model (composition \> mixin soup)
- You need complex queries across entity types (consider a different architecture)
Like any pattern, mixins are a tool. Use them when they make sense.
## Summary
SQLAlchemy mixins let you add reusable behaviors to any model without copy-pasting code everywhere. The key is:
1. Create a polymorphic table with `about_id` + `about_type`
2. Use `@declared_attr` to dynamically create relationships
3. Configure each mixin for its specific needs (`lazy`, `order_by`, etc.)
4. Add helper methods that encapsulate common operations
5. Compose multiple mixins on the same model when needed
Rails developers aren't the only ones who can have nice things.
---
**What behaviors have you made reusable in your codebase?** Drop a comment – I'm always looking for new patterns to steal.
