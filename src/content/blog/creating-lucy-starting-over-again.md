---
title: 'Creating Lucy: Starting Over (Again) (Still Not AGI)'
description: 'Revisiting my longest-running side project — Lucy — with fresh inspiration and a plugin architecture plan.'
pubDate: 'March 7, 2026'
tags: ['AI', 'Lucy']
draft: true
---

This side project is so old and never had a final, defined shape I wanted to achieve. I've overwritten a repo several times, but I can see one of the first blog posts where I started playing with this stuff is almost 2 years old!

[Creating Lucy: Your Daily Tasks Delivered with ChatGPT and Todoist Integration](https://kubaszwajka.com/blog/creating-lucy-your-daily-tasks-delivered-with-chatgpt-and-todoist-integration/)

[Creating Lucy: Developing an AI-Powered Slack Assistant with Memory](https://kubaszwajka.com/blog/creating-lucy-developing-an-ai-powered-slack-assistant-with-memory/)

Right now, Lucy — almost 2 years in — is the best side project I've ever had! The amount of things I've learned so far building it is enormous! Going back and forth with it, leaving it untouched for months, then building it almost 24/7, again and again.

Lately got super inspired by [Overment](https://x.com/_overment), [JoelClaw](https://x.com/joelhooks), [OpenClaw](https://x.com/steipete), [Coyot](https://x.com/RileyRalmuto) who build and share super cool stuff around AI and Agents and wanted to try it all out by myself. So I've `git clone lucy` one more time and started to glue all those pieces together to see how they really work.

[github.com/JakubSzwajka/lucy](https://github.com/JakubSzwajka/lucy)

## Making my hands dirty

So I can see two main reasons for this project. Let's set the scene.

- Replicate or adjust to me as much of 'openClaw like' features as I can to learn and understand how it all works and where are the challenges.
- See how far I can push my dev workflow to be like 99% agentic and autonomous yet still not in vibe coding zone. The ultimate shape is that I have a good understanding of the codebase, I like how it looks and its quality yet I'm not the one who writes the code.

## The next steps

Lucy already has some shape which is stabilising so just a few words around it.

**Key aspects that I wanted to address in the first place:**

- Extensibility - I'm trying to figure out some kind of plugin architecture for this. So far noticed that different configurations for Agents solves different problems. I don't want to rebuild it when something new will come up or the needs will change. The idea is to have it configurable via a single `.json` file injected in the build proces.
- Layers - This is something I've got from openClaw I think.
    - The gateway layer for the agent. By design it's not like "multi agent system" this time. Here `single deployable unit` == `agent`. So even if I will need more agents I can deploy a cluster of them. But I hope to have such problems! 🤷
    - The runtime layer. Pure interaction with LLM. Nothing fancy here - composing the prompts etc. Yet idea here is to be able to make a plugin interface so I can quickly add/remove different features like: memory, tools etc.
- Plugins - Both layers have a plugin interface. Runtime layer has those hooks like:
    - `onInit` → run once on startup. Idea here is to setup some cron jobs for plugins.
    - `onMessageReceived` → The message comes in. Runs before LLM. Building context for the received message.
    - `onMessageResponse` → The message comes out. Might be some validation or something?
    - `onDestroy` → On container stop. Kill what you need etc.

Even did some silly graph this morning which I'm not sure if still makes sense but want to leave it here for reference! Let's just jump into this rabbit hole. 🐰

![Lucy architecture diagram](/blog-images/creating-lucy-starting-over-again/architecture.png)
