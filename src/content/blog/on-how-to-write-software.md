---
title: 'On How To Write Software'
description: 'A working agreement for writing software with clear module boundaries, explicit facades, transactions, events, tests, and agent-friendly structure.'
pubDate: 'April 27, 2026'
tags: ['Software Design', 'AI', 'Architecture']
draft: false
---

# On How To Write Software

I wrote this originally as an internal architecture agreement for one of my projects. The more I use coding agents, the more useful this kind of document becomes: not as a grand theory of software, but as a shared contract for how humans and agents should shape code together. It gives the agent a vocabulary, boundaries, and defaults before it starts editing files.

This document defines how I want a software system to be structured as it grows.

It is not a generic architecture manifesto. It is the working agreement for this
codebase: how to name things, where code belongs, how modules talk to each
other, how transactions and events work, and how we test the result.

The goal is simple:

> Write small named programs that can be understood, tested, changed, and
> composed without loading the whole system into your head.

---

## 1. Core idea: small named programs

A good unit of software in a codebase is not merely a folder, class, service, or
function. It is a small named program.

A small program has:

- a purpose;
- a vocabulary;
- explicit inputs;
- explicit outputs;
- explicit dependencies;
- rules/invariants it owns;
- private implementation details;
- tests at its public boundary.

The main expression of this idea is the **module**, but the same thinking also
applies to use cases, processes, readmodels, and adapters.

When in doubt, ask:

- What does this unit own?
- What does it refuse to own?
- What can other code call?
- What must remain private?
- What events does it emit or consume?
- What dependencies does it use as black boxes?
- Can I test it without understanding the whole app?

---

## 2. Vocabulary

### Capability

A **capability** is something the system can do.

Examples:

- manage tasks;
- manage users;
- create messages;
- notify recipients;
- compose content;
- execute jobs;
- dispatch work from events;
- discover workers;
- reset application state.

A capability is a product/system behavior. It may be implemented by one module,
a use case, a process, or several collaborating units.

### Module

A **module** is a durable named capability boundary.

A module may own:

- data and rules;
- orchestration;
- external adapter usage;
- events;
- or a mixture of these.

A module is not required to be “pure domain.” Some real capabilities are mixed.
For example, `job-execution` owns job state and also orchestrates worker adapters.
That is acceptable when the module has a stable vocabulary and a real reason to
exist.

A module must expose a narrow public facade and hide its internals.

### Facade

A **facade** is the public behavioral interface of a module.

Other code talks to a module through its facade, not through its repositories,
helpers, mappers, or storage files.

Facade names use the `Facade` suffix:

```ts
export interface TaskManagementFacade {
  createTask(ctx: OperationContext, input: CreateTaskInput): Promise<Task>;
}

export function createTaskManagementFacade(...): TaskManagementFacade;
```

The variable name can stay natural:

```ts
const taskManagement = createTaskManagementFacade(...);
```

### Use case

A **use case** is a small named workflow that composes modules but does not yet
need durable module identity.

Use cases are appropriate for ordinary cross-module workflows.

Example:

```txt
create message with mentions
  -> discussion
  -> users
  -> notifications
```

If a workflow grows its own durable vocabulary, events, policies, or operational
lifecycle, it may become a module later.

### Process

A **process** is a use case that runs over time or reacts to events.

Examples:

- durable event delivery worker;
- work dispatch reaction;
- job execution loop;
- boot reconciliation;
- queue worker.

Processes may open multiple short transactions. They must not hold a database
transaction across external worker work, subprocess execution, long polling, or
streaming.

### Readmodel

A **readmodel** is a read-only query projection optimized for route/UI/API needs.

Readmodels are not domain modules. They may join across module-owned tables.
They must not mutate state or publish events.

### Adapter

An **adapter** connects the system to an external technical boundary.

There are two important kinds:

1. **Repository/storage adapter** — persistence implementation for module-owned
   storage. This lives inside the owning module.
2. **External integration adapter/client** — a worker CLI, third-party client,
   Git/filesystem/process integration, etc. This lives inside the consuming
   module unless it is shared/generic enough to justify a top-level
   `infrastructure/` home.

Adapters implement ports required by modules/processes. They must not contain
business rules.

---

## 3. `modules/` means real modules only

A folder under:

```txt
src/modules/<name>/
```

must represent a real module boundary.

Do not put vague technical buckets under `modules/`.

Avoid:

```txt
utils/
helpers/
common/
services/
data/
models/
misc/
```

Prefer the smallest durable vocabulary/capability name:

```txt
discussion/
notifications/
events/
job-execution/
content-composition/
job-dispatch/
task-management/
identity/
```

If something is not a module, put it somewhere else: a use case, process,
readmodel, adapter, infrastructure helper, or route-local helper.

---

## 4. Standard module shape

Target module layout:

```txt
modules/<name>/
  README.md
  index.ts
  facade.ts
  types.ts
  events.ts
  internal/
    schema.ts
    repositories.ts
    event-builders.ts
    mappers.ts
```

For larger modules, `internal/` may contain subfolders:

```txt
modules/job-execution/
  README.md
  index.ts
  facade.ts
  types.ts
  events.ts
  internal/
    jobs/
    adapters/
    executor/
    lifecycle/
    preparation/
```

For smaller modules, some files may be unnecessary, but the distinction must
remain clear:

- `index.ts` is the public doorway;
- `facade.ts`, `types.ts`, and `events.ts` define the public module contract;
- `internal/` contains private implementation details.

Other modules import only from:

```txt
modules/<name>/index.ts
```

They do not import from another module’s `internal/` folder.

---

## 5. Public module contract

A module publicly exposes:

1. its facade interface and factory;
2. backend-local public types needed by callers;
3. public event names and payload types for subscribers;
4. public module-specific errors.

A module does **not** publicly expose:

- repositories;
- storage mappers;
- event builders/factories used to publish events;
- internal helper functions;
- implementation-specific dependency containers.

Example public exports:

```ts
export {
  createTaskManagementFacade,
  type TaskManagementFacade,
} from "./facade.js";

export type {
  Workspace,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
} from "./types.js";

export {
  taskManagementEventTypes,
  type TaskCreatedEventPayload,
  type TaskUpdatedEventPayload,
} from "./events.js";

export {
  WorkspaceNotFoundError,
  TaskNotFoundError,
  TaskHierarchyValidationError,
} from "./errors.js";
```

---

## 6. Context: who and how, not what

A context object describes the current operation.

It answers:

- who is acting;
- how this operation is traced;
- which transaction is active;
- how to publish operation-bound events;
- which platform capabilities are available.

It does **not** contain domain modules.

Context is not a module registry. It is not “what capabilities exist.” Modules
are wired separately by composition root and passed explicitly where needed.

Target shape:

```ts
export interface OperationContext {
  tx: TransactionContext;

  actor: {
    userId: string | null;
  };

  request: {
    id: string;
    correlationId: string | null;
    causationId: string | null;
  };

  events: OperationEventPublisher;

  platform: {
    unitOfWork: UnitOfWork;
    ids: IdGenerator;
    clock: Clock;
    logger: Logger;
    config: ApiWorkerConfig;
  };
}
```

The exact names may evolve, but the separation should remain:

```txt
ctx.tx        transaction
ctx.actor     who
ctx.request   trace/correlation/causation
ctx.events    operation-bound event publisher
ctx.platform  shared technical capabilities
```

The context must not include:

- `taskManagement`;
- `discussion`;
- `notifications`;
- `job-execution`;
- repositories;
- readmodels;
- route objects.

Module dependencies are constructor/factory dependencies, not context lookups.
If a module/use case/process depends on another module, that dependency is
passed explicitly when the module/use case/process is created.

```ts
const collaboration = createCollaborationUseCase({
  discussion,
  notifications,
  users,
});
```

Do not pull module facades from `ctx`, globals, or hidden registries.

### Context variants

Not every operation starts from an HTTP request. The same context shape should
support several origins:

- **request context** — actor and trace data come from HTTP auth/request
  middleware;
- **system context** — actor is `null`, used by boot, maintenance, and internal
  system work;
- **event context** — actor/correlation/causation are derived from the source
  domain event when a durable subscriber reacts;
- **worker/process context** — long-running processes create short-lived
  operation contexts for each transactional phase.

The origin changes how `actor`, `request.correlationId`, and
`request.causationId` are filled. It does not change the rule that DB-touching
work receives an operation context.

---

## 7. Transactions

All DB-touching operations receive a context containing a transaction.

Default public API style:

```ts
taskManagement.createTask(ctx, input);
discussion.createMessage(ctx, input);
notifications.markRead(ctx, input);
taskReadModel.listTasks(ctx, input);
```

The transaction is explicit because transaction scope matters.

### Unit of work

The unit of work owns transaction lifecycle:

```ts
ctx.platform.unitOfWork.run(async (tx) => {
  const opCtx = createOperationContext(baseCtx, tx);
  return taskManagement.createTask(opCtx, input);
});
```

The transaction context is opaque. Domain modules do not unwrap it directly.
They pass the context/transaction to black-box dependencies.

### Modules do not need to be pure about transaction ownership

The default is:

> DB-touching facade/readmodel methods receive context and do not hide their
> transaction scope.

However, some code is naturally process-like and may manage transactions
internally:

- long-running job execution loops;
- boot reconciliation;
- event delivery workers;
- queue workers;
- maintenance processes.

This is allowed when the code is clearly an application process and uses short
transaction scopes.

### Long-running processes

Never hold a DB transaction across:

- subprocess execution;
- worker CLI execution;
- network calls that may take significant time;
- SSE/streaming responses;
- worker sleeps/polls;
- long-running loops.

Use multiple short transactions:

```txt
transaction: claim work
no transaction: execute external worker
transaction: persist result
```

---

## 8. Middleware and request context

HTTP middleware should create a base request context and attach it to the
request.

Middleware should not automatically open a DB transaction for the entire
request. Some requests stream, wait, or perform long-running work.

The route chooses the transaction boundary explicitly, ideally through a helper:

```ts
return request.app.runInTransaction((ctx) =>
  taskManagement.createTask(ctx, body),
);
```

The helper combines:

- base request context from middleware;
- a fresh transaction from unit of work;
- operation-bound event publisher.

Read-only routes follow the same context rule. A GET route that touches the DB
should still run the readmodel/facade inside an explicit transaction/context
helper, even if the transaction is read-only or short-lived.

---

## 9. Routes

Routes are transport code, not application logic.

A route may:

- parse and validate request params/body/query;
- resolve/request actor context;
- use middleware-provided request context;
- open a transaction around the required DB work;
- call one module/use-case/process/readmodel method;
- map public errors to HTTP responses;
- return transport DTOs.

A route must not:

- contain business decisions;
- orchestrate several modules inline;
- publish domain events directly;
- import repositories;
- run manual DB queries;
- import another module’s internals.

If a route needs multiple module calls, create a named use case/process or call
an existing one.

Preferred shape:

```ts
server.post("/tasks", async (request, reply) => {
  const body = createTaskBodySchema.parse(request.body);

  const result = await request.app.runInTransaction((ctx) =>
    taskManagement.createTask(ctx, body),
  );

  return mapTaskToDto(result);
});
```

---

## 10. Repositories are private

Repositories are internal implementation details of the module that owns the
storage.

Other modules do not import repositories.
Composition root does not wire private repositories directly.

Instead:

- modules construct their own repository adapters internally;
- modules expose facades;
- orchestration code calls facades;
- readmodels may use read-only query code as a separate exception.

A module may use repositories internally in the same way an orchestration module
uses other facades: as black-box dependencies.

The important rule is:

> A module may use only the dependencies explicitly given to it or created as
> its own private internals. It must not reach around another module’s facade.

---

## 11. Storage and schema ownership

Storage schema belongs to the owning module.

Target shape:

```txt
modules/task-management/internal/schema.ts
modules/identity/internal/schema.ts
modules/discussion/internal/schema.ts
modules/notifications/internal/schema.ts
modules/job-execution/internal/schema.ts
modules/events/internal/schema.ts
```

A central schema file may exist only as an assembly/barrel for migrations,
Drizzle setup, and readmodel imports:

```ts
export * from "../../modules/task-management/internal/schema.js";
export * from "../../modules/identity/internal/schema.js";
export * from "../../modules/discussion/internal/schema.js";
```

The central schema is technical assembly. Ownership remains with modules.

This is a privileged exception to the normal `internal/` rule: the schema
assembly/migration layer may import module-owned `internal/schema.ts` files in
order to build the database schema. That exception does not make module
internals public to other modules, routes, use cases, or processes.

### Cross-module references

Cross-module references are ids, usually without DB-level foreign keys.

This is intentional. It supports:

- module-owned schemas;
- orphan-safe history;
- deletion without rewriting historical records;
- event logs that survive referenced-row deletion;
- looser coupling between modules.

Examples:

```txt
task.assigneeId        references user id
message.userId        references user id
notifications.recipientUserId references user id
job.workerUserId       references user id
domainEvent.aggregateId references an aggregate id
```

Do not add cross-module FKs by default. Add one only when there is a deliberate
architectural reason and the coupling is accepted.

### Cross-module validation

At the core module boundary, foreign ids are opaque references.

At user/workflow boundaries, live existence is validated when the workflow
semantics require it.

Examples:

- task storage may preserve an assignee id as a reference;
- a user-facing “assign task to user” flow should validate the user exists
  and has the required kind if that matters;
- message history may preserve deleted/missing author ids;
- mention workflow validates mentioned users because it needs live recipients;
- job execution claim/preparation validates the live worker because it needs
  instructions/provider config.

Rule:

> Validate foreign ids when the workflow needs the referenced thing to
> participate now. Do not globally require every historical/reference id to point
> at a live row.

---

## 12. Readmodels

Readmodels live under:

```txt
src/readmodels/
```

They are route-facing, read-only query projections.

Readmodels may:

- receive `OperationContext`;
- query storage directly/read-only;
- join across module-owned tables;
- map query results toward route/API needs.

Readmodels must not:

- mutate state;
- publish events;
- enforce command invariants;
- become a place for business workflows;
- call external workers/processes.

Readmodels are an intentional CQRS-style exception to repository privacy.
They may know storage shape for efficient projections, but only for reads.

If a readmodel grows durable behavior, events, or rules beyond projection, it
should be reconsidered as a module/capability.

---

## 13. Events

Events are durable contracts between parts of the backend and between backend
and observers.

### Event ownership

A module publishes events about things it owns.

Examples:

```txt
task-management publishes task lifecycle events
identity publishes user lifecycle events
discussion publishes message lifecycle events
notifications publishes notifications lifecycle events
job-execution publishes job lifecycle events
```

Orchestration/use-case/process code may publish events only about workflows it
owns. It should not publish lifecycle events pretending to be another module.

Example target:

```txt
discussion creates message -> discussion publishes message.created
collaboration coordinates discussion + notifications -> collaboration does not publish message.created
```

### Public event contract

A module publicly exposes event information so other modules/processes know what
they can subscribe to.

Public:

- event type constants/names;
- payload TypeScript types;
- event union types if useful;
- README documentation.

Private:

- event builders/factories used by the owning module to publish events.

Public event contract example:

```ts
export const taskManagementEventTypes = {
  taskCreated: "task.created",
  taskUpdated: "task.updated",
} as const;

export interface TaskUpdatedEventPayload {
  workspaceId: string;
  taskId: string;
  before: TaskMutableState;
  after: TaskMutableState;
}
```

Internal module code may use private helpers:

```ts
makeTaskUpdatedEvent(...)
```

but these helpers are not exported for other code to publish.

### Event publishing API

Operation context exposes an operation-bound event publisher:

```ts
await ctx.events.publish({
  type: "task.updated",
  aggregateType: "task",
  aggregateId: task.id,
  sourceModule: "task-management",
  payload,
});
```

The operation-bound publisher supplies transaction/actor/correlation metadata
from context.

The calling module still supplies:

- event type;
- aggregate type;
- aggregate id;
- source module;
- payload.

The raw object above shows the publish input shape. Inside a module, prefer
private event builders/constants so `type`, `sourceModule`, aggregate metadata,
and payload shape do not drift. Those builders remain private to the owning
module.

### Event payloads

Event payloads are not full row dumps.

They should contain:

- identity fields;
- minimal semantic snapshot needed by durable consumers/readmodels;
- stable data that should survive future row changes/deletions.

Examples:

```json
{
  "taskId": "...",
  "workspaceId": "...",
  "before": {
    "title": "Old title",
    "bodyMd": "...",
    "status": "todo",
    "assigneeId": null
  },
  "after": {
    "title": "New title",
    "bodyMd": "...",
    "status": "doing",
    "assigneeId": "..."
  }
}
```

Avoid:

- payloads with only ids when durable history needs semantic data;
- full storage row snapshots;
- transport DTOs as payload contracts;
- arbitrary large stdout/stderr/content dumps.

### Subscribers

Subscriber implementation lives with the owner of the reaction.

Subscriber registration happens in composition/application root, not inside the
events module.

The events module owns event storage, fanout, and delivery mechanics. It does
not know every policy subscriber in the system.

Durable subscribers are at-least-once consumers. They must be idempotent and
safe to retry after partial failure. Use stable idempotency keys, usually derived
from the triggering event id, before registering a durable subscriber that
creates or mutates state.

---

## 14. Orchestration, use cases, and module dependencies

Cross-module orchestration should usually live in a named use case/process.

Modules may depend on other modules only when the dependency is:

- explicit;
- narrow;
- acyclic;
- justified by the depending module’s capability.

Ordinary cross-module workflows should not be hidden in routes.

Allowed when justified:

```txt
job-execution -> content-composition
job-dispatch -> job-execution + users
```

Prefer use case/process for ordinary composition:

```txt
create-message-with-mentions -> discussion + users + notifications
```

No module dependency cycles.

If a cycle appears, break it by extracting:

- a use case;
- a process;
- an event boundary;
- a smaller shared concept;
- or a narrower port.

---

## 15. Authorization and actor checks

Authentication identifies the actor. Authorization and business permission rules
belong to the module/use case/process that owns the operation.

Routes may reject unauthenticated/invalid credentials as transport/auth setup,
but they should not accumulate business authorization rules.

Examples:

- a task assignment workflow decides whether the actor can assign a task;
- job execution decides whether an worker can be used for a job;
- maintenance decides whether reset is allowed in the current operational state.

Actor attribution for events comes from context. Permission to perform the
operation is a separate rule owned by the capability.

---

## 16. IDs, time, and deterministic dependencies

Module/use-case/process code should use platform capabilities from context for
business ids and timestamps:

```ts
ctx.platform.ids
ctx.platform.clock
```

Avoid direct `randomUUID()`, `Date.now()`, or `new Date()` in module behavior
unless there is a deliberate infrastructure reason.

This keeps tests deterministic and makes event/state timestamps consistent.
Infrastructure code may use system APIs directly when it is actually managing
technical concerns such as files, subprocesses, or crypto.

---

## 17. Errors

Expected business/domain failures are part of the public facade contract.

Module errors should be specific and exported through the module public API.

Prefer:

```ts
WorkspaceNotFoundError
TaskNotFoundError
TaskHierarchyValidationError
UserNotFoundError
ActiveJobsPresentError
```

Avoid vague names:

```ts
NotFoundError
ValidationError
BadRequestError
```

Module errors expose:

```ts
code: string;
kind: "not_found" | "validation" | "conflict" | "unauthorized" | "forbidden";
```

They do not expose HTTP status directly.

Routes map `kind` to HTTP status:

```txt
not_found    -> 404
validation   -> 400
conflict     -> 409
unauthorized -> 401
forbidden    -> 403
```

Unexpected errors bubble as 500-level failures.

---

## 18. Contracts package boundary

`@app/contracts` owns the HTTP transport boundary only.

It contains:

- request schemas;
- param/query schemas;
- response DTO schemas;
- shared transport enums/unions;
- inferred transport types for API/CLI/web.

It does not contain:

- module facade types;
- repositories;
- storage rows;
- backend service types;
- composition-root types;
- backend-local event payload contracts unless explicitly exposed as HTTP DTOs.

Module types/events are backend-local.

Routes/readmodels map backend-local results to transport DTOs from
`@app/contracts`.

The `/events` API may expose a generic transport event envelope from contracts,
but module event payload types remain backend-local unless intentionally made a
transport contract.

---

## 19. Adapters and external clients

Repository/storage adapters live inside the owning module.

External integration adapters live near the module that owns their use unless
they are shared/generic.

Use:

```txt
modules/job-execution/internal/worker-adapters/
```

when worker adapters are job-execution-specific.

Use a top-level infrastructure area only for genuinely shared technical clients:

```txt
src/infrastructure/git/
src/infrastructure/process/
src/infrastructure/worker-clients/
```

Infrastructure code must not contain business rules. It implements technical
ports.

---

## 20. Tests

The default test boundary is the facade.

### Data-owning modules

Test through the public facade and use a real DB for the module’s own
persistence.

Example:

```ts
await runWithTestContext(async (ctx) => {
  const task = await taskManagement.createTask(ctx, input);
  assert.equal(task.title, input.title);
});
```

Assert:

- persisted state;
- public return values;
- domain events emitted;
- invariants/errors.

Do not mock the module’s own repositories by default. They are private internals
and should be tested through behavior.

### Orchestration modules/use cases

If a module/use case uses another module as a black-box dependency, mock/fake
that dependency.

Example:

```txt
collaboration uses discussion + notifications + users
  -> fake discussion
  -> fake notifications
  -> fake users
  -> assert orchestration behavior
```

Do not pull in a full DB just to test another module’s behavior through an
orchestration unit.

### Mixed modules

For mixed modules such as job-execution:

- use real DB for storage the module owns, e.g. jobs/job events;
- mock/fake external adapters, worker CLIs, content composition, or other module
  facades as black boxes.

### Internal tests

Internal tests are allowed for complex private pieces, but they are not the
default.

Use internal tests for:

- tricky SQL/repository behavior;
- parsers/renderers;
- adapter edge cases;
- pure algorithms;
- concurrency/idempotency helpers.

Internal tests may import internals of the module they are testing. They should
not turn internals into public contract.

### Route tests

Route tests should focus on:

- transport validation;
- auth/request context behavior;
- error-to-HTTP mapping;
- DTO shape;
- proof that route calls the intended capability.

They should not be the primary place for domain behavior tests.

---

## 21. Composition root

Composition root assembles the application.

It wires:

- shared platform capabilities;
- facades;
- use cases;
- processes;
- readmodels;
- subscribers;
- worker/adapters;
- init/shutdown hooks.

Composition root should not need to import private repositories from modules.
Modules construct their own private storage adapters.

Composition root may collect modules/readmodels into a registry for routes, but
that registry is not operation context and must not be passed around as `ctx`.

---

## 22. Anti-patterns

Avoid these:

### Importing another module’s internals

Bad:

```ts
import { createTaskRepository } from "../task-management/internal/repositories.js";
```

Use the facade or a named use case/process.

### Publishing another module’s event

Bad:

```ts
// collaboration publishing message.created
await ctx.events.publish({ sourceModule: "discussion", type: "message.created", ... });
```

The owning module publishes its own lifecycle events.

### Route-level orchestration

Bad:

```ts
const message = await discussion.createMessage(ctx, input);
await notifications.createMentionItem(ctx, ...);
await jobExecution.requestJob(ctx, ...);
```

Create a named use case/process.

### Generic buckets

Bad:

```txt
utils/
helpers/
common/
services/
```

Name the behavior or capability.

### Full row event payloads

Bad:

```ts
payload: taskRow
```

Use a minimal semantic event payload.

### Cross-module FK by default

Bad default:

```txt
tasks.assignee_id -> users.id FK
```

Prefer opaque references unless the coupling is deliberately accepted.

### Context as module registry

Bad:

```ts
ctx.taskManagement.createTask(ctx, input)
```

Context is who/how. Modules are what.

### Hidden time/id globals in module behavior

Bad:

```ts
const id = randomUUID();
const occurredAt = new Date();
```

Prefer context/platform capabilities:

```ts
const id = ctx.platform.ids.newId();
const occurredAt = ctx.platform.clock.now();
```

---
