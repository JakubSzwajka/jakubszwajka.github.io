---
title: 'A Small Blueprint for Building Business Apps With Agents'
description: 'The runtime, stack, workflow, and review loop I keep using when I build practical business MVPs with AI agents.'
pubDate: 'June 20, 2026'
tags: ['AI', 'Architecture', 'Patterns']
draft: true
---

I have been trying to make my AI-assisted development loop less magical.

Not less useful. Just less magical.

The first version of this thought was basically a long tool list: server, domain, Docker, proxy, monitoring, analytics, auth, billing, emails, agents, PRDs, skills, reviews, deploy scripts, and so on.

That list is useful, but only if there is a shape behind it. Otherwise it becomes another "use these 17 tools and become productive" post, and I do not think that is the interesting part.

The interesting part is this:

If I want agents to help me build small business applications, I need a boring operating model around them.

Not a perfect platform. Not Kubernetes. Not a full internal developer platform. Just enough structure so that:

- the app can be shipped quickly;
- a human can understand and take over the result;
- the runtime is boring enough to debug;
- design and UX do not collapse into generic AI UI;
- the next agent has artifacts to read instead of guessing from chat history.

The target here is not "the app that scales to millions on day one."

The target is more like: pretty good MVPs, internal tools, client portals, intake flows, dashboards, small SaaS experiments, and product surfaces where the biggest risk is usually unclear scope, weak handoff, or messy architecture. Not raw traffic.

This is the shortest blueprint I can currently give myself.

```text
notes / messy idea
  -> repo doctrine
  -> PRD + challenge
  -> small agent implementation loop
  -> proof from tests / browser / deploy
  -> container image
  -> compose stack
  -> monitoring + analytics
  -> docs updated for the next run
```

The key thing is that every arrow should leave behind something readable.

Not a vibe. An artifact.

## 1. Start with a boring runtime

I like having one small server I understand.

For my current private projects this means a VPS, Docker, Docker Compose, and a reverse proxy in front of containers. A domain points at the server. The proxy routes hostnames to the right container. The app stack is just a Compose file plus environment variables.

That is not the only valid setup. Managed platforms are still great when they remove work. But for the kind of apps I am building now, a single Docker host gives me a useful constraint:

> If I cannot explain how this app runs in a Compose file, maybe I do not understand the app yet.

The minimum runtime layer looks like this:

| Layer | Job |
| --- | --- |
| VPS | one machine that runs the apps |
| DNS | domain or subdomain points to the server |
| reverse proxy | routes HTTP/HTTPS to the right container |
| Docker Compose | names the services, networks, volumes, ports, health checks |
| monitoring | machine/container stats, logs, image update awareness |
| analytics | product traffic/events, separate from infra monitoring |

I do not want the deployment tool to become the architecture.

So I try to keep the runtime contract explicit:

- what image runs;
- which process starts;
- which port is exposed;
- which network it joins;
- which volumes are stateful;
- which env vars are runtime config;
- which secrets must never be baked into the image;
- how to know the deploy is alive.

That sounds boring because it is boring.

But boring is exactly what I want from the runtime.

## 2. Keep the app stack small

The app shape I keep reaching for is not surprising:

| Surface | Default |
| --- | --- |
| public site / landing / docs | Astro |
| authenticated app | React + Vite |
| API | Fastify |
| data | Drizzle + Postgres |
| runtime | Docker image + Compose |

There are variants.

If the product is content-first, Astro alone is enough.

If it is a tiny prototype or single-tenant client thing, SQLite can be enough.

If there is no real background work, I do not add a worker just because "real apps have workers."

The point is not the exact stack. The point is that I do not want to spend every new project rediscovering the same decisions.

I want the agent to see familiar boundaries:

- `site` is public and SEO-ish;
- `web` is the logged-in UI;
- `api` owns the product behavior;
- `db` stores state;
- background processes are named explicitly when they exist.

The more predictable this is, the less the agent has to invent.

And the less I have to review at the foundation level every time.

## 3. Buy boring product plumbing

For business apps, I do not want to build auth from scratch.

I also do not want to build billing plumbing before the product deserves it.

The current default is:

- Clerk or a similar identity layer for auth, access, waitlist, and maybe subscription UX;
- Stripe when real payments matter;
- Resend or a similar email API for transactional emails;
- Umami or Plausible for analytics when I want simple product signal.

This is not because those tools are perfect.

It is because every hour spent hand-rolling login, invitation emails, password reset, checkout state, or analytics dashboards is an hour not spent on the product workflow.

There is still architecture here. Actually, this is where a lot of hidden architecture lives.

You still need to decide:

- what is a user in your domain;
- what belongs to an organization or workspace;
- which role can do what;
- what happens before payment exists;
- which email is transactional and which is marketing;
- what events are worth tracking;
- which data should not leave your system.

Buying a tool does not remove those decisions. It just moves the low-level plumbing out of the first week.

## 4. Make the repo readable by agents

This is the part I keep caring about more and more.

The useful unit of AI-assisted work is not the prompt.

It is the context that survives after the prompt is gone.

For a repo, I want at least:

```text
AGENTS.md
docs/knowledge/
docs/tasks/active/<task>/
  prd.md
  tasks.md
  log.md
```

`AGENTS.md` is the entry contract. It says what this repo is, what not to touch, how to run checks, and what rules are sharp.

`docs/knowledge/` is the durable project memory. Architecture, product language, deployment rules, quality notes, decisions that should not be rediscovered every week.

`docs/tasks/active/<task>/` is the workbench for a specific change. Not a giant project-management ceremony. Just enough state so that another agent can continue without asking me to re-explain the last two hours.

The simple version:

- `prd.md` says what problem we are solving and what is out of scope;
- `tasks.md` splits the work into reviewable chunks;
- `log.md` records decisions, surprises, failed paths, and validation evidence.

I used to think the main thing was "write a better prompt."

Now I think the better question is:

> What file will the next agent read before editing code?

If the answer is "nothing", then the workflow is fragile.

## 5. Build product capabilities before agent magic

I do not want agents to live in a parallel product.

If an agent updates a task, drafts a message, changes a status, or writes a note, it should do that through product capabilities the system already understands.

That means the boring product questions still matter:

- which actor is doing this;
- what can this actor see;
- what can this actor change;
- who is it acting for;
- what should be written to the audit trail;
- where does human approval start.

This is where prompt-only control starts to feel weak.

If a rule matters, I want it outside the prompt too. Permissions, budgets, tool allowlists, validation gates, and review requirements should be product or runtime rules, not just hopeful instructions inside a model message.

The agent can still be flexible. But the system should decide what actions are allowed.

That is the difference between an agent helping inside the app and a script with a secret key doing whatever the prompt suggested today.

## 6. Let agents block weak plans

One of the best changes in my workflow was giving agents permission to say no.

Not in a dramatic way. More like:

- this PRD is missing ownership rules;
- this task is too big to review;
- this migration has no rollback story;
- this UI implies features we did not agree to build;
- this deployment plan does not name the runtime processes;
- this test change weakens the signal.

For bigger features, I like a challenge pass before implementation.

Sometimes it is a product challenge. Sometimes architecture. Sometimes design. Sometimes just a repo-aware "what is missing here?" pass.

The important thing is to run it from the artifacts, not from my memory.

If a fresh agent cannot understand the PRD, the future implementation agent will probably misunderstand it too.

This is a cheap simulation of future confusion.

And it is much cheaper than finding the missing decision after the code exists.

## 7. Keep implementation loops small

When the plan is ready, I do not want one huge agent run that changes everything.

I want chunks.

A good chunk has:

- a narrow goal;
- known files or module boundaries;
- a validation command;
- expected proof;
- a small diff I can review.

For frontend work, proof usually means a browser check. Not just "build passed." I want screenshots, layout checks, no obvious overflow, and no fake UI states.

For backend work, proof means tests that hit the behavior, not only mocks that prove the function was called.

For deployment work, proof means the rendered Compose config, pull/up output, health checks, and a clear list of env vars or secrets that changed.

The agent should leave proof in the PR or task log.

If it says "done" but cannot show how it knows, I still have work to do.

## 8. Deploy image, then Compose

The deployment loop I like is also boring:

```text
build image
push immutable tag
copy / update compose file on server
export exact image tag
docker compose config
docker compose pull
docker compose up -d --wait
docker compose ps
check health endpoint
report what changed
```

For first-party apps, I prefer immutable image tags for production deploys. Something like an environment plus a git SHA. `latest` is fine as a fallback while bootstrapping, but I do not want production to depend on whatever `latest` means at that moment.

I also want a clear split between build-time and runtime config.

Public frontend values can be build args because they end up in browser JavaScript anyway.

Runtime secrets belong in server env or protected CI secrets.

This is one of those places where agents can make a very expensive mistake while trying to be helpful. If a secret ends up baked into an image, the deploy worked and the architecture still got worse.

So the deploy contract needs to be explicit enough that the agent can follow it and I can review it.

## 9. Ask for the red flags

When I review AI-built work, I am not only looking at whether the happy path works.

I am looking for weird movement around the edges.

Red flags:

- tests were deleted, skipped, or weakened;
- config changed without explanation;
- auth or permission checks moved to a softer layer;
- the UI got prettier but invented product behavior;
- generated code duplicated a module instead of using the existing boundary;
- migrations are irreversible but treated as casual;
- `.env` or runtime secrets became part of the app image;
- the agent changed formatting across unrelated files;
- the PR claims proof but only shows a build.

This is why the boring artifacts matter.

If the PRD says what is out of scope, I can catch scope creep.

If the deploy doc says where secrets live, I can catch bad config movement.

If the architecture doc says routes are adapters, I can catch business logic drifting into route handlers.

The agent is faster when the repo is explicit.

The human review is also faster for the same reason.

## The tiny version

If I had to compress this into one note for an agent, it would be this:

```text
Build a small business app.

Use boring foundations:
- public site if needed;
- app UI if users log in;
- API with clear capability boundaries;
- Postgres unless there is a good reason not to;
- Docker image and Compose runtime;
- auth, email, and billing as bought plumbing;
- analytics when product signal matters.

Before implementation:
- write the PRD;
- challenge the missing decisions;
- split work into reviewable chunks;
- document what is out of scope.

During implementation:
- keep diffs small;
- leave validation proof;
- do not weaken tests;
- do not invent product behavior from UI polish;
- update durable docs when the model changes.

Before deploy:
- build immutable image tags;
- keep secrets out of images;
- render Compose config;
- pull/up/wait;
- check health;
- report exactly what changed.
```

This is not a grand theory.

It is just the shape I keep coming back to because it makes agent-built work easier to inspect.

And from my perspective, that is the real constraint.

Not "can the agent build it?"

The answer is often yes.

The better question is:

> Can I understand, review, run, and hand off what it built?

If the answer is no, then I did not build an AI-native workflow.

I just made a faster mess.
