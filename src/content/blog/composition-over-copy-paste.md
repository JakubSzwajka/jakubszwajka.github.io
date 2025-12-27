---
title: 'Composition Over Copy-Paste: Building Reusable Behaviors with Type Discriminators in SQLAlchemy'
description: 'You know that feeling when you need to add the same feature to multiple models in your app? Like, you want several different entities to have comments, or alerts, or notifications...'
pubDate: 'December 22, 2025'
tags: ['Python', 'SQLAlchemy', 'Patterns', 'Architecture', 'HowTo']
---

Working on a booking platform, we needed alerts and notes that could attach to any entity – bookings, users, profiles. The obvious approach was copy-pasting relationships everywhere.

Instead, we built reusable behaviors using composition: write it once, add it to any model. This isn't a SQLAlchemy trick – it's an architectural pattern that works anywhere. Here's how we built composable behaviors that work across the entire system.

## The Problem: Cross-Cutting Behaviors

Picture this: you're building a booking platform. Product comes to you with two requests:

**Request 1**: "We need a way to track alerts – missing documents on bookings, incomplete onboarding on users, expired contracts, failed payments. The system should automatically create and resolve these."
**Request 2**: "Admins want to leave notes on things – bookings, user profiles, captioner profiles. You know, internal context that helps us manage accounts."

The naive approach? Create separate tables for each combination: `booking_alerts`, `user_alerts`, `booking_notes`, `user_notes`, `captioner_profile_notes`... yeah, no thanks.
The slightly better but still annoying approach? Manually add the same relationship code to every model. Copy, paste, hope you don't miss anything when you add the next entity type.

**There's a better way.**

## The Solution: Composition with Type Discriminators

The core idea: **composition** (mixins that add behaviors) + **type discriminators** (one table that references multiple entity types using a discriminator column). This pattern isn't SQLAlchemy-specific – Rails has it, Django has it, you can build it in any ORM. The key insight is separating the "what" (the behavior) from the "who" (the entity type).

Here's how it works: create ONE table per behavior that can reference any entity type using a type discriminator, then use a mixin to compose that behavior into any model that needs it.

We'll build two examples:
1. **Alerts** – system-generated warnings that get resolved
2. **Notes** – admin-created comments with audit trails

Both use the same discriminator-based pattern, but configured differently for their specific needs.

### This Isn't About SQLAlchemy

Before we dive into code, let's be clear: this is an **architectural pattern**, not a SQLAlchemy feature. The concepts are universal:

- **Type discriminators**: A database design pattern where one table references multiple entity types using a discriminator column. Rails calls this `polymorphic: true`, Django calls it `GenericForeignKey`, and you can build it in any ORM or even raw SQL.

- **Composition**: Using mixins to compose behaviors into classes. This is "composition over inheritance" in action.

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

    __table_args__ = (
        Index('ix_alerts_about_type_id', 'about_type', 'about_id'),
    )

    def resolve(self):
        self.resolved = True
        self.resolved_at = datetime.now(UTC)
```
Notice the `about_id` + `about_type` combo? That's our type discriminator. It lets ONE table reference many different entity types by storing both the ID and the type of the entity.

### Composing the Alert Behavior
Now here's where composition shines. We create a mixin that any model can use to compose in the alert behavior:
```python
class AlertableMixin:
    @declared_attr
    def alerts(cls) -> Mapped[list[AlertModel]]:
        return relationship(
            'AlertModel',
            primaryjoin=lambda: and_(
                AlertModel.about_type == literal(
                    cls.__name__.upper().replace('MODEL', '')
                ),
                foreign(AlertModel.about_id) == cls.id,
            ),
            viewonly=True,
            lazy='raise',  # Force explicit loading
        )

    def create_alert(self, *, alert_type: AlertType) -> AlertModel:
        """Create a new alert for this entity"""
        return AlertModel(
            about_type=self.__class__.__name__.upper().replace('MODEL', ''),
            about_id=self.id,
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
- **Composition**: The mixin composes the alert behavior into any model that inherits it
- **Discriminator-based relationship**: `@declared_attr` creates the relationship dynamically, using the type discriminator (`about_id` + `about_type`)
- **Type extraction**: The `primaryjoin` extracts the entity type from the model name (`UserModel` → `USER`) – this is how we match alerts to the right entity
- **Explicit loading**: `lazy='raise'` prevents N+1 queries – you MUST explicitly load alerts when you need them using `selectinload(BookingModel.alerts)` in your query. This prevents the common performance pitfall where loading 100 bookings triggers 100 additional database queries.
- **Encapsulation**: Helper methods encapsulate common operations, keeping the behavior's API clean

The mixin is a reusable component. Add it to any model, and that model gets alert functionality. That's composition in action.

### Composing Alerts into Models
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
    alert_type=AlertType.MISSING_DOCUMENTS
)
await session.commit()
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
    admin_id: Mapped[str] = mapped_column(ForeignKey('admins.id'))
```
Same discriminator-based pattern, but with audit fields and a relationship to track who created the note.

### Composing the Note Behavior
```python
class NoteableMixin:
    @declared_attr
    def notes(cls) -> Mapped[list[NoteModel]]:
        return relationship(
            'NoteModel',
            primaryjoin=lambda: and_(
                NoteModel.about_type == literal(
                    cls.__name__.upper().replace('MODEL', '')
                ),
                foreign(NoteModel.about_id) == cls.id,
            ),
            viewonly=True,
            lazy='select',  # Auto-load when accessed
            order_by='desc(NoteModel.created_at)',  # Most recent first
        )

    def create_note(self, *, content: str, admin_id: str) -> NoteModel:
        return NoteModel(
            about_type=self.__class__.__name__.upper().replace('MODEL', ''),
            about_id=self.id,
            content=content,
            admin_id=admin_id,
        )
```
**Notice the differences?**
- `lazy='select'` instead of `lazy='raise'` – `lazy='select'` auto-loads notes when you access `booking.notes`, which is convenient but can cause N+1 queries if you're not careful (loading 100 bookings will trigger 100 separate queries). `lazy='raise'` forces you to explicitly load relationships (using `selectinload()` or `joinedload()`), preventing accidental N+1 queries. Choose based on your query patterns: use `'raise'` for performance-critical code, `'select'` for admin panels where convenience matters more.
- `order_by='desc(NoteModel.created_at)'` – always get most recent notes first
- `create_note()` requires `admin_id` for audit trail

### Composing Notes into Models
```python
class BookingModel(BaseModel, AlertableMixin, NoteableMixin):
    __tablename__ = 'bookings'
    # ... fields

class CaptionerProfileModel(BaseModel, NoteableMixin):
    __tablename__ = 'captioner_profiles'
    # ... fields
```
See that? `BookingModel` uses BOTH mixins. It composes both behaviors – alerts and notes – independently. This is the power of composition: each behavior is a separate, reusable component you can mix and match.
```python
# Admin leaves a note
booking = await booking_repo.get_booking_by_id(booking_id)
note = booking.create_note(
    content="Customer called about missing invoice",
    admin_id=current_admin.id
)
```
## Configuration Choices Matter
Both mixins use the same discriminator-based pattern, but they're configured differently because they have different needs:
<table header-row="true">
<tr>
<td>Feature</td>
<td>Alerts</td>
<td>Notes</td>
</tr>
<tr>
<td>**lazy**</td>
<td>'raise'</td>
<td>'select'</td>
</tr>
<tr>
<td>**Why?**</td>
<td>Performance-critical queries with many entities. Forces explicit loading (selectinload/joinedload) to prevent N+1 queries.</td>
<td>Admin UI with fewer entities loaded. Convenience over performance. Still risks N+1 if loading many records.</td>
</tr>
<tr>
<td>**order_by**</td>
<td>None</td>
<td>desc(created_at)</td>
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

This flexibility is the power of composition. Same discriminator-based structure, different configuration per behavior. Each mixin encapsulates one concern, and you compose them together as needed.

## Performance Considerations

Type discriminator patterns work great, but they require attention to performance at scale:

### Composite Indexes Are Essential

Always add composite indexes on your discriminator columns. Without them, queries will scan the entire table:

```python
class AlertModel(BaseModel):
    # ... fields ...

    __table_args__ = (
        Index('ix_alerts_about_type_id', 'about_type', 'about_id'),
    )
```

The index order matters: `('about_type', 'about_id')` works best for queries that filter by type first, then ID.

### Query Performance at Scale

When your discriminator table grows to millions of rows, queries can slow down:

```python
# ❌ BAD: Without index or with lazy='select', this is slow
bookings = await session.execute(select(BookingModel).limit(100))
for booking in bookings.scalars():
    print(booking.alerts)  # N+1 queries! 100 separate SELECT queries

# ✅ GOOD: Explicit loading with selectinload
bookings = await session.execute(
    select(BookingModel)
    .options(selectinload(BookingModel.alerts))
    .limit(100)
)
for booking in bookings.scalars():
    print(booking.alerts)  # Single additional SELECT with IN clause
```

Use `lazy='raise'` to catch N+1 queries during development, then use `selectinload()` or `joinedload()` for explicit loading.

### When to Denormalize

If you're querying "number of unresolved alerts" frequently, consider denormalizing:

```python
class BookingModel(BaseModel, AlertableMixin):
    # Cache the count
    unresolved_alert_count: Mapped[int] = mapped_column(default=0)
```

Update the count when alerts are created/resolved. This trades write complexity for read performance.

## Other Behaviors This Pattern Unlocks
Once you see this pattern, you start seeing it everywhere. Here are 5 more real-world use cases where the same discriminator-based composition approach works perfectly:
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
    uploaded_by_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
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
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
```
**Use case**: Users can favorite articles, products, search queries, dashboard views, reports. Build a "My Favorites" page that shows everything they've saved, regardless of type. One query, heterogeneous results.

### 5. ReviewableMixin – Reviews and Ratings
```python
class ReviewModel(BaseModel):
    __tablename__ = 'reviews'

    reviewed_id: Mapped[str]
    reviewed_type: Mapped[ReviewType]
    reviewer_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    rating: Mapped[int]  # 1-5 stars
    comment: Mapped[Optional[str]]
```

**Use case**: Marketplace where users review products, sellers, AND delivery services. One review system, different entity types. Easy to build aggregate ratings and "most helpful" sorting.
---
All of these follow the same architectural pattern: **type discriminator** (`{entity}_id` + `{entity}_type`) plus behavior-specific fields. The mixin composes the relationship boilerplate, you just add the business logic. This is composition in action – each behavior is a reusable component you can mix into any model.

## Why This Approach Works

This pattern works because it's built on solid architectural principles:

**Composition Over Inheritance**: Instead of creating deep inheritance hierarchies, you compose behaviors. Each mixin is a focused, single-responsibility component.

**Type Discriminators**: One table per behavior that can reference any entity type. This is a database design pattern that predates SQLAlchemy – Rails calls it "polymorphic associations", Django calls it "generic relations". The concept is universal.

**Reusability**: Add `AlertableMixin` or `NoteableMixin` to any model. No code duplication. Write once, use everywhere.

**Type Safety**: Enums give you autocomplete and catch typos at development time.

**Composability**: Mix and match behaviors on the same model. Need alerts AND notes? Add both mixins. This is the real power – behaviors are independent, composable units.

**Maintainability**: Behavior logic lives in ONE place. Need to change how notes work? Change the mixin. All models using it get the update automatically.

**Scalability**: One table per behavior, infinite entity types. Want to add alerts to a new entity? Just add the mixin to your model class. No migration needed. The `alerts` table already handles any entity type. This is huge when you're iterating fast.

**Zero Migration Tax**: This is worth emphasizing. With traditional approaches, adding the same behavior to a new entity means creating a new table (`contract_alerts`) and running a migration. With this pattern? Add one line (`AlertableMixin`) to your model. Done. The discriminator-based table already supports it.
## When NOT to Use This
Don't use this pattern if:
- You only have ONE entity type that needs the behavior (just use a normal relationship)
- Your behaviors are complex and entity-specific (inheritance might be better)
- You're adding too many mixins to one model (composition \> mixin soup – if you need 10+ behaviors, maybe the model is doing too much)
- You need complex queries across entity types (discriminator-based queries can be tricky – consider a different architecture)
- Foreign key constraints are critical (type discriminators can't use database-level foreign keys across multiple tables)

Like any pattern, composition and type discriminators are tools. Use them when they make sense. The tradeoff is flexibility vs. referential integrity – discriminator-based associations give you flexibility but lose some database-level guarantees.

## Summary

This pattern combines two powerful concepts: **type discriminators** (a database design pattern) and **composition** (an architectural pattern). The result is reusable, composable behaviors that eliminate copy-paste.

The key steps:
1. **Design a discriminator-based table** with `about_id` + `about_type` (the type discriminator)
2. **Create a mixin** that composes the behavior using `@declared_attr` to dynamically create relationships
3. **Configure each mixin** for its specific needs (`lazy`, `order_by`, etc.)
4. **Add helper methods** that encapsulate common operations
5. **Compose multiple mixins** on the same model when needed

This isn't SQLAlchemy magic – it's composition and type discriminators. Rails has `polymorphic: true`, Django has `GenericForeignKey`, and you can build this pattern in any ORM or even raw SQL. The SQLAlchemy implementation is just one way to express it.

The real value? You're building reusable, composable components instead of copy-pasting code. That's good architecture, regardless of your ORM.
