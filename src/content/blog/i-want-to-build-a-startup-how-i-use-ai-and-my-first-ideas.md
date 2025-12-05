---
title: 'I want to build a startup - how I use AI and my first ideas.'
description: 'Ok, I think it’s time to officially admit that I want to build something and I want to make it public! Time to go out of the basement.'
pubDate: 'March 2, 2025'
tags: ['Random', 'Side Projects']
---

Ok, I think it’s time to officially admit that I want to build something and I want to make it public! Time to go out of the basement. 

In general I this post is a bit of shift I want to do from writing only about “how to do xyz” to writing about “what I’m currently doing”. Seems a bit challenging to me but let’s give it a go. 

# A bit of context

Right now, everything is about AI, how easy it is to make software, how fast we can ship etc. Since I’ve always was thinking about building something I thought its time to stop thinking and start doing. 

A month has passed, and I have 3 ideas in progress. 

But more about them later. 

# The AI Role

Obviously I’m using AI for them a lot. And I have some thoughts. We have awesome tools. Cursor, Claude, GPT etc. we can count them all but its not the point. 

They bring some solutions together with some problems (that I think can be avoided in long term). 

# **Maintain or Ship MVP?**

That’s the first question I would ask. And It’s not about using AI or not. For me it’s more about **how caution I should be** when using them. 

Will give you an example. Initial views for [www.mydancedna.com](http://www.mydancedna.com) were files 1k lines or more. AI Generated with Cursor and Claude. I’ve setup the project with react and shadcn components and I was happily pointing to docs and building.  

And here comes the tradeoff for not paying enough attention. The code was almost impossible to maintain. The moment I’ve started discovering some bugs or requesting very little changes, it was harder to achieve the right because of too big **context.** 


> 
**The solution:** from the very beginning. Try to be explicit about the code structure, how split components, how to not only build the solution but also how to build the codebase itself. I found the `.cursorrules` very helpful. 
Right now I’m also exploring the `*.mdc` files for the rules. Maybe will write about them more later.  



# How much I need to validate?

Honestly? Idk. Didn’t validate successfully anything so far 🤷. 

But! I’m trying to prevent myself from building the whole system before I will show it to somebody. I think people in general are able to imagine something. Maybe also imaging something you are not even expecting them to do. 

What I’m saying here is that I’m trying to show them only mocked frontend views right now. Ofc. I have some backend written, there are some http calls flying back and forth. But the current strategy is something like: 

- generate as much ‘clickable’ views you can to show the idea.
- give it to people to click.
- gather feedback.


> 
Actually.. if you want to click it a bit and give any feedback or thoughts? I would really appreciate that 🙏.  

🌐 here is the link: [https://www.mydancedna.com/](https://www.mydancedna.com/)

- 📜 here is the form: [My Dance Dna Feedback ](https://www.notion.so/1aa2997bdce3808cbe39f24517b3d335?pvs=21)
    
    


# How I fill missing positions in my startup.

I’ll be honest. There is a planty of things I have no idea how to do. Starting from designing the frontend, the UX, writing a good copy, product design, talking to people etc. I’m good at backend stuff (period).  

That means that there is a lot of open positions in my little startups 😅.  

And yes, so far I’m just trying to fill them with AI tools. 

**Missing the correct scope for MVP:** write a prompt for product designer. Talk with him what could be the best scope. Document it and move on. 

**Missing landing page:** write a prompt for UX/UI designer. Talk with him what should be included based on your documentation. Document it and use Cursor. 

**Missing XYZ:** write a prompt for ABC. Talki with him … Document it… and move on. 

This is awesome way of doing things so far 👆. Looking at how much caution I need to be when it comes to backend stuff, I assume there is a lot of pros that will tell me why it can be bad. But so far? It’s enough.

The **key takeaway** here would be **context** again. The part where I say “document it”. Those “ai hires” need to share some context. It’s pain in the ass to explain each time what the project is about. That’s why I’m doing more documentation in my personal projects then professional ones. lol. The better common understanding of what they need to achieve the better results they will produce. 

# What’s next?

Validation, Validation, Validation. I really want to build and I’m forcing myself to stop before next steps. At least that’s what internet gurus are advising. 

So one little small reminder: 

🌐 here is the link: [https://www.mydancedna.com/](https://www.mydancedna.com/)

- 📜 here is the form: [My Dance Dna Feedback ](https://www.notion.so/1aa2997bdce3808cbe39f24517b3d335?pvs=21)
    
    

**Other 2 ideas**

I said that I’ve 3 ideas in progress. MyDanceDna is the biggest one. But there are two other “tools that I would like to have” 

- db client with:
    - graph view based on foreign keys. I think that would be useful. Jumping into new project and being able to see visually those relations and dependencies.
    - filtering on this graph view. This is what I’m missing sometimes when debugging. Lets say in easy example you have users table, orders table and products table. And In this graph view I have filtered by user, so when I click on this table relations I have already filters applied based on foreign keys. I think that would be useful for devs. Thoughts?
- visual api tests builder:
    
    I found that keeping good openapi schema is sooooo helpful. So I’m trying to build this tools where:
    
    - You can upload the schema and see all endpoints and their structure.
    - Visually build flows and business processes.
    - **SAVE** and **RUN** them from local machine. Something like e2e tests.

**Any thoughts about those two? Please put a comment if you find them interesting!**