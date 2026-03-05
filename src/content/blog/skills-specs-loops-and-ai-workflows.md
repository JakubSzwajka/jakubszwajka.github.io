---
title: 'Skills, Specs, Loops and AI workflows'
description: 'How I structure AI agent workflows using skills, PRDs, task lists, and implementation loops.'
pubDate: 'March 5, 2026'
tags: ['AI', 'Patterns']
---

I've started taking more and more care about my agent's skills. Right now 80% of my interactions start with `/command` to trigger certain skill, and then reviewing the diff.

That means they compose some kind of the workflow in the loop where I'm just calling next steps. Will try to describe it here a bit.

All my skills should be defined here: [github.com/JakubSzwajka/skills](https://github.com/JakubSzwajka/skills)

## First loop - What and How

The core of each change in the codebase is specification so let's talk about this first.

`/smart-prd` - produce a document describing problem, proposed solution etc. From my experience the size and scope here is what will have the biggest impact on the result. The wider the scope is, the more time it takes to make it really detailed and find all cases to take care of. I find it really challenging to decide where to put a line between being to explicit and allowing agent to decide on implementation.

But let's look at produced files.

`README.md` - this will be our main file.

```
{Title - short description of the change}
Problem
{What's broken, missing, or suboptimal? Describe from the user's perspective. Why does this matter now? 3-8 sentences max.}

Proposed Solution
{High-level sketch of what we'll build or change. No implementation details - just the shape of the solution. What will be different when this is done? 3-8 sentences max.}

Key Cases
{Bullet list of the main scenarios this change needs to handle. These are NOT user stories yet - just the high-level cases we know about. They'll be expanded into detailed stories later.}

{Case 1}
{Case 2}
{Case 3}
Out of Scope
{What this PRD explicitly does NOT cover. Prevents scope creep when coming back to flesh out stories.}

{Not doing X}
{Not doing Y}
Open Questions
{Things we don't know yet that will need answers before or during implementation.}

{Question 1}
{Question 2}
References
{Links to related ADRs, issues, docs, conversations, or external resources.}

{Reference 1}
```

Along the high level core plan I'm creating another two files.

`tasks.md` - plan for the work. Dependencies between tasks and their statuses. I've found that having it high level with key gotchas and **in single file** works best so far. Splitting each task into separate file miss lot of important context later and in reality is not saving so much tokens.

Reference task format:

```
---
prd: <prd-slug>
generated: YYYY-MM-DD
last-updated: YYYY-MM-DD
---

# Tasks: <PRD Title>

> Summary: <1-2 sentence overview of what this task list covers>

## Task List

- [x] **1. <title>** - <one-line description>
- [ ] **2. <title>** - <one-line description>
- [ ] **3. <title>** - <one-line description> `[blocked by: 1, 2]`

---

### 1. <title>
<!-- status: done -->

<2-5 sentence description of what to do and why.>

**Files:** `src/foo.ts`, `src/bar.ts`
**Depends on:** -
**Validates:** <how to know it's done - e.g. "tests pass", "form renders">

---

### 2. <title>
<!-- status: pending -->

<2-5 sentence description.>

**Files:** `src/baz.ts`, `lib/util.ts`
**Depends on:** 1
**Validates:** <acceptance check>

---
```

`notebook.md` - "Shared scratchpad for agents working on this PRD. Read before starting a task. Append notes as you go".

Not sure where I found it but for `notebook.md` the word "append" seems like a key thing so that next agents can "add" not "modify" the knowledge they find worth sharing for next agents.

### Specification Validation

At this point I found it helpful to run `/prd-challanger` a few times to the point that it starts asking questions about releasing strategy etc. So the questions that are not so important for this specific change.

The point here is to figure out what important pieces where skipped when creating PRD docs and left in the previous conversations. Remember to run it in a new session so that we can simulate the same understanding of docs that future agent will have.

A few iterations and human review and we should be ready to start another loop.

## Second Loop - Implementation

At this point we have to options. Run it in the loop or one by one. Depending on the size of expected outcome to review I'm choosing one or another.

### AFK

The loop/ralph prompt look like this. You can find it here. Refs are the files produced in the previous loop.

[github.com/JakubSzwajka/ralph - prompts.py](https://github.com/JakubSzwajka/ralph/blob/main/ralph/core/prompts.py)

### Step by Step

If the change is too big to digest review at the end I prefer to do it step by step.

**Checkpoints**

Having this PRD and task list I can asses that i.e. tasks 1-4 can be done in a single run. Also what I found a nice addition is ask agent to prepare a checkpoints for me. So that the Agent can note in `README.md` stuff like:

```
### Checkpoints

- **CP0 (after 0):** issuer_id FK dropped (Alembic migration + ORM changes),
  SYSTEM-context writes work, accounting query engine uses explicit LEFT JOIN
  for issuer display. All existing tests pass.
- **CP1 (after 1-7, 22):** All new models + repos exist alongside
  TransactionModel. Migration has run - new tables created + backfilled.
  Zero behavior change. All existing tests pass unchanged.
- **CP2 (after 8-11):** Facades write to new models. Earnings recorded on
  booking completion (net after fees, using FeesService). PaymentRefunded
  domain event preserved. Unit tests adapted and passing.
- **CP3 (after 12-18):** Query engines + routes migrated. get_payment_status
  on read model. booking_queries.py uses PaymentModel. All API endpoints
  return correct data.
- **CP4 (after 19-21):** Cross-module coupling removed. Referral updated.
  `grep -r "BookingModel" modules/domain/finance/` and
  `grep -r "TransactionModel" modules/domain/bookings/` return nothing.
- **CP5 (after 23-25):** Old table dropped, all tests green. Done.
```

So I have a high level understanding of the "chunks" where I can start testing manually. This is useful in bigger changes.

**Agent picks the chunks to implement.**

At this point the work should be in such small chunks that you should do it with agent with no skills.

But still I find helpful to add a few of them. Especially `deep-research` one.

[skills/deep-research/SKILL.md](https://github.com/JakubSzwajka/skills/blob/main/deep-research/SKILL.md)

I've found similar concept here: [youtube.com - rmvDxxNubIg](https://youtu.be/rmvDxxNubIg?si=JWl14H9AfmcZDNgO&t=788)

So the Agent in its own run can decide how to implement it. I have a few subagents defined for:

- **research** - understanding the logic around our change. Just looking if there are no surprises hidden in the code, checking if agent is actually capable of introducing a change etc. It's basically "smart-context-gathering".
- **implementing** - I like to have it separate and focused on implementation. Master agent at this point is delegating (based on the context) specific change to be introduced. Very often a few in parallel!
- **test runner** - this is super helpful. And it's not about "how to run tests", but if tests fail, compact the trace into meaningful insights so that master agent can properly delegate the fix/adjustments.
- **review** - delegate the review to drop the context of author of the changes.

And this basically closes the second loop. Interesting is that second loop can find missing pieces in initial docs and its easy to just add it there as a "next" tasks to implement which will be tackled in second loop.

## Other skills

There are a few other which have no specific place in the whole workflow yet must say they "automate" a lot. Check them in [github.com/JakubSzwajka/skills](https://github.com/JakubSzwajka/skills/tree/main).

Document your skills, share them, iterate on them. This is the new dotfiles.
