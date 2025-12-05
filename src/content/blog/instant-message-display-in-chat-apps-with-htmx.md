---
title: 'Instant Message Display in Chat Apps with htmx'
description: 'While building my AI assistant, I needed a simple chat interface to test it locally. The challenge was displaying user messages instantly while waiting for API responses...'
pubDate: 'August 1, 2024'
tags: ['HowTo']
---

## Problem overview

While building my AI assistant, I needed a simple chat interface to test it locally. Building a whole React app seemed overkill, so I tried HTMX. The challenge was that the response logic took time (at least 5 calls to OpenAI API) for a single query. For better UX, I wanted the user message displayed instantly and the assistant's response appended afterward.

## Solution

**TLDR:  repo is here:**

[https://github.com/JakubSzwajka/hono-htmx-chat](https://github.com/JakubSzwajka/hono-htmx-chat)

The idea is pretty simple:

- Send query and expect only the assistant's response in ready-to-display HTML.
- Append user message to the conversation upon form submission.

For this example I've added `setTimeout` to simulate some logic.

```tsx
// index.ts (so called 'backend')

const app = new Hono()

const messages: { user: string, message: string }[] = []

app.get('/', serveStatic({ path: './static/index.html' }))

app.get('/messages', (c) => {
  return c.html(messages.map(msg => `<p><strong>${msg.user}:</strong> ${msg.message}</p>`).join(''))
})

app.post('/message', async (c) => {
  const formData = await c.req.formData()
  const message = formData.get('message') as string
  messages.push({ user: 'user', message })

  await new Promise(resolve => setTimeout(resolve, 2000))

  // Simple response logic
  const responseMessage = `Received your message: ${message}`
  messages.push({ user: 'Assistant', message: responseMessage })

  return c.html(`
    <p><strong>Assistant:</strong> ${responseMessage}</p>
  `)
})
```

Client logic here does the trick. Simple function that appends user query to the conversation body.

```html
// index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat App</title>
    <script src="https://unpkg.com/htmx.org@1.6.1"></script>
  </head>
  <body>
    <h1>Chat App</h1>
    <div id="chat" hx-get="/messages" hx-trigger="load" hx-swap="innerHTML">
      <!-- Chat messages will be displayed here -->
    </div>
    <form id="messageForm" hx-post="/message" hx-trigger="submit"
      hx-swap="beforeend"
      hx-target="#chat"
      onsubmit="handleSubmit(event)">
      <input type="text" id="message" name="message" placeholder="Your message"
        required>
      <button type="submit">Send</button>
    </form>
  </body>
  <script>
    function handleSubmit(event) {
      event.preventDefault();
      const message = new FormData(event.target).get('message');
      const newMessage = document.createElement('p');
      newMessage.innerHTML = `<strong>User:</strong> ${message}`;
      document.getElementById('chat').appendChild(newMessage);
    }

  </script>
</html>
```

> HTML structure for a single message is repeated in a few places. You can extract it into some JSX with Hono, but I didn't cover that here.
