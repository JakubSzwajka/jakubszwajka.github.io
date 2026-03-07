---
title: 'Creating Lucy: Starting Over (Again) (Still Not AGI)'
description: 'Revisiting my longest-running side project — Lucy — with fresh inspiration and a plugin architecture plan.'
pubDate: 'March 7, 2026'
tags: ['AI', 'Lucy']
---

This side project is so old and never had a final, defined shape I wanted to achieve. I've overwritten a repo several times, but I can see one of the first blog posts where I started playing with this stuff is almost 2 years old!

[Creating Lucy: Your Daily Tasks Delivered with ChatGPT and Todoist Integration](https://kubaszwajka.com/blog/creating-lucy-your-daily-tasks-delivered-with-chatgpt-and-todoist-integration/)

[Creating Lucy: Developing an AI-Powered Slack Assistant with Memory](https://kubaszwajka.com/blog/creating-lucy-developing-an-ai-powered-slack-assistant-with-memory/)

Right now, Lucy — almost 2 years in — is the best side project I've ever had! The amount of things I've learned so far building it is enormous! Going back and forth with it, leaving it untouched for months, then building it almost 24/7, again and again.

Lately got super inspired by [Overment](https://x.com/_overment), [JoelClaw](https://x.com/joelhooks), [OpenClaw](https://x.com/steipete), [Coyot](https://x.com/RileyRalmuto) who build and share super cool stuff around AI and Agents and wanted to try it all out by myself. So I've `git clone lucy` one more time and started to glue all those pieces together to see how they really work.

[github.com/JakubSzwajka/lucy](https://github.com/JakubSzwajka/lucy)

## The next steps

I want to document current Lucy shape and some future enhancements as I build them. The plan is to steal like an artist to gain proper understanding of the whole agentic stuff here.

First I want to clean up the repo with a plugin architecture — something composable and configurable. Then make it run in the background and actually learn.

Will leave here a note for myself with this weird diagram I made this morning.

![Lucy architecture diagram](/blog-images/creating-lucy-starting-over-again/architecture.png)

The idea here is to have like a core runtime and something like a plugin interface where I can easily add memory and tools via config file. The hooks for the runtime plugins would be:

- `onInit` → run once.
- `onMessageReceived` → building context for the received message.
- `onMessageResponse` → saving the response
- `onDestroy` → opposite to onInit.

I can think of a similar concept to be added to parts like `http_gateway`. For example `WhatsApp` plugin to `http_gateway` since both will serve some http endpoints.

Let's just jump into this rabbit hole.
