# Blog Ideas

Working backlog of article ideas worth turning into fragments, outlines, or drafts.

## Agents Are Parties

**Working thesis:** agents that can act inside a product should be modeled as parties, not as background jobs, API keys, or invisible workers.

Why it matters:

- An agent that mutates app state needs identity, attribution, permissions, and audit history.
- In agentic systems, "who acted?" becomes a product question, not only a logging detail.
- Access should often be the intersection of the human user's scope and the agent's roster/scope.
- Agent output is not just text. It can be comments, task moves, assignments, artifacts, and tool calls.

Possible angles:

- Why treating the worker process as the actor is wrong.
- What changes when agents become first-class parties in the domain model.
- Agent chat vs agent automation: same actor class, different interaction surfaces.
- How this applies to the class of systems Kuba is building: AI-first work tools, project agents, inbox-driven automation.

Raw title options:

- `Agents Are Parties, Not Background Jobs`
- `Why Agentic Apps Need a Party Model`
- `The Moment an Agent Can Write, It Needs an Identity`

Source context:

- Repo: [life-os](/Users/kuba.szwajka/DEV/priv/life-os) (`git@github.com:JakubSzwajka/life-os.git`)
- Agent attention inbox PRD: [prd.md](/Users/kuba.szwajka/DEV/priv/life-os/docs/tasks/active/2026-05-15-agent-attention-inbox/prd.md)
- Domain-owned agent loop PRD: [prd.md](/Users/kuba.szwajka/DEV/priv/life-os/docs/tasks/active/2026-05-15-domain-owned-agent-loop/prd.md)
- Agent chat PRD: [prd.md](/Users/kuba.szwajka/DEV/priv/life-os/docs/tasks/active/2026-05-15-agent-chat/prd.md)
- Runtime boundary PRD: [prd.md](/Users/kuba.szwajka/DEV/priv/life-os/docs/tasks/active/2026-05-15-domain-runtime-boundary/prd.md)
- Related research note in this repo: [README.md](/Users/kuba.szwajka/DEV/priv/blog/docs/research/codex-history-blog-topics/README.md)

## Prompt Is Not a Control Plane

**Working thesis:** prompts can guide behavior, but if a rule matters, enforce it deterministically outside the prompt.

Concrete source:

- Private newsletter generation repeated source URLs even when recent editions were included as context.
- The useful fix was a deterministic fresh-source feedback loop: block stale URLs before search results reach the model, then validate final output after generation.
- The prompt still carries editorial memory, but enforcement lives in code and metadata.

Possible angles:

- Learnings from building a source-aware newsletter generator.
- Why "the model saw the history" is not a guarantee.
- Search-result filtering before model selection.
- Final validation after model generation.
- Metadata as proof that the loop worked.

Raw title options:

- `Prompt Is Not a Control Plane`
- `What I Learned Building a Deterministic Feedback Loop Around an LLM`
- `When Prompt Guardrails Are Not Enough`

Source context:

- Repo: [private-newsletter](/Users/kuba.szwajka/DEV/priv/priv-newsletter/private-newsletter) (`git@github.com:JakubSzwajka/priv-newsletter.git`)
- Fresh source gate PRD: [prd.md](/Users/kuba.szwajka/DEV/priv/priv-newsletter/private-newsletter/docs/tasks/active/2026-05-14-fresh-source-gate/prd.md)
- Fresh source gate task log: [log.md](/Users/kuba.szwajka/DEV/priv/priv-newsletter/private-newsletter/docs/tasks/active/2026-05-14-fresh-source-gate/log.md)
- Admin analytics follow-up context: [prd.md](/Users/kuba.szwajka/DEV/priv/priv-newsletter/private-newsletter/docs/tasks/active/2026-05-15-admin-analytics-query-state/prd.md)
- Related research note in this repo: [README.md](/Users/kuba.szwajka/DEV/priv/blog/docs/research/codex-history-blog-topics/README.md)

## My Agents Started Saying NO-GO

**Working thesis:** the biggest improvement in agentic coding workflows is not more autonomy, but agents with clear roles, doctrine, and permission to block weak plans.

Concrete source:

- Recent workflow uses role-specific skills/agents: product, architect, designer, developer, QA.
- PRDs are challenged before implementation.
- Review agents can return `NO-GO`, not just rubber-stamp a plan.
- Repo learnings and doctrine make future agents less likely to repeat the same mistakes.

Possible angles:

- Follow-up to the current writing around skills, specs, loops, and AI workflows.
- Agents as skills with responsibility boundaries.
- Why a good agent is allowed to disagree.
- PRD challengers as a cheap simulation of future code review.
- How doctrine, task logs, and completion audits make work resumable.

Raw title options:

- `My Agents Started Saying NO-GO`
- `The Best Coding Agent Is Sometimes the One That Blocks You`
- `Skills, Doctrine, and the Agent Review Loop`

Source context:

- Skills repo: [skills](/Users/kuba.szwajka/.agents/skills) (`git@github.com:JakubSzwajka/skills.git`)
- Existing related post: [skills-specs-loops-and-ai-workflows.md](/Users/kuba.szwajka/DEV/priv/blog/src/content/blog/skills-specs-loops-and-ai-workflows.md)
- Current architecture-style follow-up: [on-how-to-write-software.md](/Users/kuba.szwajka/DEV/priv/blog/src/content/blog/on-how-to-write-software.md)
- Repo learnings skill: [SKILL.md](/Users/kuba.szwajka/.agents/skills/engineering/docs/repo-learnings/SKILL.md)
- PRD creation skill: [SKILL.md](/Users/kuba.szwajka/.agents/skills/engineering/docs/prd-create/SKILL.md)
- Grill-me skill: [SKILL.md](/Users/kuba.szwajka/.agents/skills/grill-me/SKILL.md)
- Related research note in this repo: [README.md](/Users/kuba.szwajka/DEV/priv/blog/docs/research/codex-history-blog-topics/README.md)

## Suggested Writing Workflow

Use the repo-local writing skills copied from `mattpocock/skills`:

- `writing-fragments` to mine raw claims, examples, and sharp sentences.
- `writing-shape` to turn a fragment pile into a publishable article.
- `writing-beats` when the article should feel more like a narrative journey than a linear argument.
