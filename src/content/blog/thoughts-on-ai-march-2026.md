---
title: 'AI Tooling, Skills & Modular Code — March 2026 Thoughts'
description: 'Thoughts on AI tooling, skills and modular code.'
pubDate: 'March 1, 2026'
tags: ['Architecture', 'Patterns', 'AI', 'Random']
---

It's been like 2 months since I wrote last thing and the urge to shape something new was growing bigger and bigger. That being said I want to experiment a bit with much shorter form or at least different form then the one I used to do. Let's see where it will take us.

![](https://media2.giphy.com/media/v1.Y2lkPTc5NDFmZGM2bjVpdGRxMXJ4NXhjNjYzODJ4NmdoNWw4cG02NTRiODEybjFzNThjdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/14bWswbeWGzYEo/giphy.gif)

And yes, there will be a lot about AI but it's more like a snapshot of thoughts and learnings that might be outdated in a week so please remember that.

## This job is even more fun!

Yes, so last months I've built a few things for myself besides my regular job and it's so fun!

**Lucy.** I have a theory. At some point, most of devs (maybe even people?) will have some kind of AI assistant. But still we are far from that. I've reincarnated the Lucy project which I started like a year or more ago during AI Devs (1st or 2nd edition?) and its even easier to iterate and experiment. During one month Lucy became 100% electron app → then backed with server logic just to figure out that I don't want to solve the app distribution problem right now and migrated to web app. The beauty of it is that it was basically a one Claude Code session to migrate it from one to another.

**Ralph**. Initially I ignored the hype but after focusing more and more on a toolset around my own AI assisted development workflow I've noticed that for some cases I'm just: "yes, please do that" → "yes, correct" → "that's right" → "ok.." etc. so why not put it into the loop?

And again.. started as a `.sh` script → turned into TUI → added headless mode. Iterating is so fast. Ofc those are not critical prod systems but rather tools to build such! I can talk about prod systems and AI later.

So I've created this repo.

[https://github.com/JakubSzwajka/ralph](https://github.com/JakubSzwajka/ralph)

And here is another theory that might come much faster then the one about AI assistant. For each dev **skills** and **ralph** repos are new **dotfiles.**

Also made myself one.

[https://github.com/JakubSzwajka/skills](https://github.com/JakubSzwajka/skills)

Let's talk about skills now maybe for a bit.

## Skills - Build for repo or for user?

I'm working for this client where I'm the only backend dev so there is no merge friction etc. so there is a lot of space for experiments in the code itself. That's why like 90% of the experiments around AI tooling was there. Things like:

- how to write prompts.
- how to write PRDs.
- how to write [CLAUDE.md](http://CLAUDE.md) / [AGENTS.md](http://AGENTS.md)
- MCPs
- Agents and subagents
- etc. etc.

Everything new was battle tested there because of the size of the codebase and my knowledge about it. This allowed for fast verification of whether the tool works correctly.

At this point I've spotted one thing.

**AI tools configured in codebase are like documentation -** the moment you stop maintaining them, they become a burden rather than a help.

So I've stripped them down as much as I can from repo specific stuff, declared my skills the same way and guess what... more or less had the same results.

I'm not saying you shouldn't do [CLAUDE.md](http://CLAUDE.md) in your repo. Probably you will find a few use cases sooooo specific to your problem that you should do that but for me `~/.claude/CLAUDE.md` is the main one.

Also note that I'm ✨multilingual ✨. Joke. Just using Python and TypeScript but still you can specify rules for typing and code structure to be language agnostic right? Cuz everybody wants to have types in Python right? right?

Code structure and AI. Let's just talk briefly about it.

## If AI makes you 10x, proper modularisation + AI will make you 100x. End of clickbait.

My take is that modularisation is hard. Like really hard and not so obvious. Finding domains, subdomain, contexts, models and all those crazy keywords I personally love from DDD world is really hard and not so obvious! And then connecting them is even harder. And the fact that AI is sooo shitty at it, is crazy.

I've spent a fair amount of hours trying to get it right and there are two terms that made this "aha" moment for me. **CAPABILITIES** and **OPERATIONS.**

And this is something you can discuss with AI (working on a skill for that btw. ). In my words:

- look for repeatable "skills" of your system.
- look for processes orchestrating those skills to ship value.

Will give you an example from the platform I'm working on. This is how I've modeled it some time ago and I still like it!

So we needed to verify some users before we will allow them to provide services in the platform. That involves:

- skill check → totally separate feature where users were proving that they actually can do the job.
- legal background check → with 3rd party service.
- certification verification → a bit of a manual process.

Having all 3 makes user visible. So for me here capability is that we can verify certain things under certain aspects. No matter what is it. In this case:

- user was entity and aspect was skill check.
- user was entity and aspect was legal background.
- user's skill (certification) was entity and aspect was if it's true and not expired.

That means:

- **skill testing** is just operation ending with making a record in **verification** capability.
- **background check** is operation ending with making a record in **verification** capability.
- **certification check** is operation ending with making a record in **verification** capability.

That means if I want to know if user can be fully onboarded:

- **onboarding** is operation ending with checking records in **verification** capability.

And here is the thing. Process of verifying something is most likely the same for everything here.

- how we checked it?
- who checked it?
- when does check expire?
- why we rejected it?

I hope you see the pattern, and I'm not delulu.

![](https://media4.giphy.com/media/v1.Y2lkPTc5NDFmZGM2N3hlejh5NDhiMjhncHlrdjl3Z3Ayc3JldG93NG4yZGwxMGZncTFuaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/vltEp68yLidmh4LENC/giphy.gif)

Oh and actually AI is not so good at finding stuff like that. BUT! Speaking of AI I've found that thinking like this makes you build more and more small modules that are more independent. That means, they can have their own [README.md](http://README.md) and interface. Then it's easy to add some architecture unit test to avoid spaghetti imports (check e.g. [tach](https://github.com/tach-org/tach)) and it will be easier for your agent to digest bigger codebases! This is super important from my perspective. Will try to elaborate more on that in the future.

## It meant to be short..

It's not so short as I thought but each of these can be separate blogpost with more details. Yet tried to catch some thoughts across the last months. Ping me if you find it interesting or want to discuss anything here or have some different thoughts about it!
