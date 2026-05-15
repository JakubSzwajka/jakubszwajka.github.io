# Codex History Blog Topics Research

Date: 2026-05-15

## Scope

Local Codex history scanned:

- `~/.codex/sessions/2026/05/11`
- `~/.codex/sessions/2026/05/12`
- `~/.codex/sessions/2026/05/13`
- `~/.codex/sessions/2026/05/14`
- `~/.codex/sessions/2026/05/15`

Observed sample:

- 268 non-empty session files
- 84 user-originated sessions
- 181 subagent sessions
- Main project clusters: Life OS, private newsletter, SnapCap, SnapCap admin panel, Recall live captions POC, this blog, Szewc Online, local agent skills

I cross-checked session history against local task artifacts and recent git history in the relevant repos. The strongest signals came from task PRDs/logs, completion states, and commits rather than raw chat volume.

## Strongest Work Themes

### 1. Agentic product architecture

Life OS moved quickly through multiple hard architecture decisions:

- Mastra/OpenRouter agent loop
- agent attention inbox
- domain-owned agent runner
- domain runtime boundary
- agent chat as a separate module from agent automation
- user/agent membership intersection for read/write tools

The interesting public angle is not "I built an AI app." The angle is that agentic products need ordinary software boundaries: queues, dedupe, explicit source events, runtime ownership, attribution, access checks, and durable transcripts.

### 2. Prompt guardrails vs deterministic guardrails

The newsletter work found a measurable quality failure: repeated primary source URLs across editions. The PRD records 165 repeated URL occurrences in 731 final items, repeats in 60 of 101 editions, and high repeat rates in slow-moving newsletters.

The decision was to stop relying only on prompt context and add a fresh-source gate:

- blocked URL sets from recent editions
- search result filtering before the model sees stale URLs
- final validation after generation
- metadata proving what was blocked or removed
- env-selected strategy rollout

The public lesson: prompts are memory, not enforcement.

### 3. Runtime boundaries and transaction ownership

Two repos converged on the same idea from different directions:

- SnapCap: move default DB transactions toward API/runtime entrypoints, with explicit `force_new` exceptions.
- Life OS: make API and worker thin adapters, while `packages/domain/runtime` owns DB construction, transactions, module assembly, and process phases.

The reusable blog angle is about making transaction boundaries visible at runtime edges and keeping external I/O outside open transactions.

### 4. Real-time media is multiple pipelines

The Recall/Speechmatics work split meeting preview and captions into separate paths:

- RTMP/MediaMTX/HLS for video/audio preview
- verified backend WebSocket for raw Recall audio
- server-side Speechmatics Realtime session
- normalized partial/final caption events
- later participant-separated audio for real speaker identity

The useful public angle is practical: a live meeting app is not one stream. Video playback, raw audio ingestion, transcription provider semantics, browser event delivery, and cleanup all fail differently.

### 5. Admin product surfaces need state contracts

Admin panel work across the newsletter and SnapCap admin repos kept returning to state ownership:

- URL-backed admin tab/filter/page state
- time-series admin analytics from existing metadata
- explicit React Query invalidators instead of mutation-name heuristics
- domain-specific adapters around dense data tables
- breadcrumb label ownership separated from chrome rendering

The public angle is that "admin UI" is not throwaway CRUD once operators depend on it. Query keys, URL state, breadcrumb data ownership, and analytics semantics become product contracts.

### 6. Agents need review loops that can say no

Recent work repeatedly used PRD challengers, role stewards, review agents, NO-GO/GO passes, completion audits, and repo learnings. This is a stronger sequel to the existing AI workflows post:

- the value is not more agents
- the value is structured disagreement before code
- task docs become a transfer protocol between humans and agents
- durable repo learnings reduce repeated corrections

## Recommended Blog Topic Ranking

### 1. Prompt Is Not a Control Plane

Thesis: If a rule matters, enforce it outside the prompt. Use the newsletter freshness work as the concrete case: history in context did not stop repeats, so search filtering and final validation had to become deterministic gates.

Suggested outline:

1. The symptom: repeated sources despite recent-history context.
2. Why the model kept doing it.
3. The fresh-source gate: block before search results reach the model, validate after draft generation.
4. Metadata as proof, not vibes.
5. Where prompts still belong.

### 2. The Agent Attention Inbox

Thesis: Agent workflows should not subscribe directly to every raw app event. Put an attention inbox between domain events and agent runs so you can dedupe, coalesce, suppress agent-originated loops, and explain why an agent woke up.

Suggested outline:

1. The self-triggering trap.
2. Why "comment.created" is too low-level for agent automation.
3. Attention items as product-language work: mentioned, assigned, human activity.
4. Dedupe, coalescing, source refs, actor suppression.
5. Why there is no user-facing inbox in V1.

### 3. Agents Are Parties, Not Background Jobs

Thesis: Once an agent can mutate app state, it needs identity, attribution, permissions, and project scope like any other actor. Life OS's agent chat and automation split makes this concrete.

Suggested outline:

1. The mistake: treating the worker as the actor.
2. Agent party identity and transcript attribution.
3. Membership intersection: user access AND agent roster.
4. Read tools vs write tools.
5. Why chat and automation should be separate modules.

### 4. API And Worker Should Be Adapters, Not Mini-Domains

Thesis: Application runtimes become easier to reason about when domain runtime owns DB composition, transactions, and workflow phases while API/worker code only authenticates, schedules, validates transport input, and delegates.

Suggested outline:

1. The porous boundary smell.
2. Runtime facade as app-facing surface.
3. Transaction ownership and short transaction phases.
4. External I/O outside DB transactions.
5. Import rules as architecture tests.

### 5. Live Captions Are Not "Just Add WebSockets"

Thesis: Real-time captions require a second backend-owned pipeline beside media preview, with separate verification, provider sessions, partial/final semantics, backpressure, cleanup, and safe browser DTOs.

Suggested outline:

1. RTMP/HLS preview vs raw audio transcription.
2. Why the provider key and raw payloads stay server-side.
3. Partial captions are replaceable; final captions are immutable.
4. Participant-separated audio and real speaker identity.
5. What local testing cannot prove without live tunnels and credentials.

### 6. Admin UI State Is Product State

Thesis: Once an admin screen is used for real operations, URL state, query invalidation, breadcrumb data ownership, and analytics semantics deserve explicit contracts.

Suggested outline:

1. Why back-button/shareable admin URLs matter.
2. React Query invalidation as domain knowledge.
3. Data table adapters for dense workflows.
4. Breadcrumbs should render labels, not own domain fetching.
5. Analytics from existing metadata before inventing new event tables.

### 7. A Practical Transaction Boundary Cleanup

Thesis: Moving the default DB transaction to runtime entrypoints can reduce decorator noise, but only if exceptions are named and tested.

Suggested outline:

1. Why scattered `@transactional` became cognitive load.
2. One ambient operation transaction.
3. `force_new` for audit/failure/batch exceptions.
4. WebSocket and background job exceptions.
5. Tests that prove rollback and session cleanup.

### 8. My Agents Started Saying NO-GO

Thesis: The biggest improvement in AI coding workflow is not more autonomy, but structured adversarial review before implementation.

Suggested outline:

1. Role stewards: product, design, architecture, QA, developer.
2. PRD challengers as a cheap future-code-review simulation.
3. Why "NO-GO" is useful.
4. How task docs, logs, and completion audits make work resumable.
5. What still needs human taste.

## Best First Picks

If the goal is the next strong public post, choose one of:

1. `Prompt Is Not a Control Plane` - strongest because it has measured evidence and a general lesson.
2. `The Agent Attention Inbox` - strongest original architecture idea from Life OS.
3. `Agents Are Parties, Not Background Jobs` - likely to age well as agentic apps become common.

The captions post is also strong, but it should wait until live external verification is complete so the post can include real failure modes and evidence rather than only design.
