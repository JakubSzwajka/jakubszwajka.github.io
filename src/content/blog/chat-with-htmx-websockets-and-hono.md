---
title: 'Chat with HTMX, WebSockets and Hono'
description: 'Last week, I wrote about [tweaking `htmx` to display instant messages](https://kubaszwajka.com/posts/posts/instant-message-display-in-chat-apps-with-htmx). ...'
pubDate: 'August 6, 2024'
tags: ['HowTo']
---

Last week, I wrote about [tweaking **`htmx`** to display instant messages](https://kubaszwajka.com/posts/posts/instant-message-display-in-chat-apps-with-htmx). A week into using HTMX, I needed more. I wanted a better way to stream HTML from the server, using JSX components instead of plain HTML strings for better code usability.


> 💣 Quick reminder: if you find this useful, please give it a thumbs up! Your support helps me create more content.


Here’s the list of tools I used:

- HTMX
- [HTMX Websockets Extension](https://v1.htmx.org/extensions/web-sockets/)
- Hono for the backend

# Websockets - client side

The idea is simple. My **`Conversation`** component is wrapped in a **`div`** with **`hx-ext="ws"`**, which connects to my backend when rendered.

```tsx
export const Conversation = (props: { messages: Message[] }) => (
  <div hx-ext="ws" ws-connect="/chatroom-ws">
      <div id="conversation">
        {props.messages.reverse().map((message) => (
          <div>
            <UserMessage message={message} />
            <AssistantMessage message={message} />
          </div>
        ))}
      </div>
	    <InputMessageForm />
  </div>
);
```

Next important thing is the `InputMessageForm`. Just add **`ws-send`** to the form, and it will send a message where the key is the textarea’s ID (**`messageInput`**) with its value.

```tsx
export const InputMessageForm = () => (
  <form id="query-submit-form" ws-send className="relative">
    <textarea
      id="messageInput"
      name="userMessage"
      placeholder="Type your message here..."
      rows={4}
    ></textarea>
    <button
      type="submit"
    >
      Send
    </button>
  </form>
);
```

# Websockets - server

Here’s the full code block for the Hono server. Some console logs for opening and closing connection. **`onMessage`** is where the magic happens.

```tsx
get(
    '/chatroom-ws',
    upgradeWebSocket((c) => {
      return {
        onOpen: () => {
          console.log('WS Connection open');
        },
        onClose: () => {
          console.log('WS Connection closed');
        },
        onMessage: async (event, ws) => {
          const { userMessage } = JSON.parse(event.data.toString());
          console.log('Got user message', userMessage);
          const inputArea = await c.html(
            <div id="query-submit-form">
              <InputMessageForm />
            </div>,
          );
          ws.send(await inputArea.text());
          const htmlUser = await c.html(
            <div id="conversation" hx-swap-oob="beforeend">
              <UserMessage
                message={{
                  id: v4(), // some random ids used here for placeholder
                  query: userMessage,
                  completion: '',
                  conversationId: v4(),
                  toolsResponse: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }}
              />
            </div>,
          );
          ws.send(await htmlUser.text());
          const response = await talk(userMessage);
          const htmlAgent = await c.html(
            <div id="conversation" hx-swap-oob="beforeend">
              <AssistantMessage message={response} />
            </div>,
          );
          ws.send(await htmlAgent.text());
        },
      };
    }),
```

So the flow is: 

1. Receive the query
2. Send back empty `<InputMessageForm/>` just to make it clean. There is no `hx-swap-oob` specified so its `True` by default. That means that it will find the element with `id=query-submit-form` and swap it.   
3. Send back the component with the user message. Here `hx-swap-oob` is specified to `beforeend` which simply means that it will be added to existing messages.
4. talk → here comes your logic. I’m talking to AI assistant so making some external api calls. 
5. Send back the component with assistant answer. The same as step 3. but the component is different.  

# Problems I found

Sending response back was a bit problematic since docs are hmm… not that easy to understand I think. There is even an [issue created to fix this](https://github.com/bigskysoftware/htmx/issues/2552). That helped me a lot! 

So the most important thing is: 


> 💣 You need to send back string, that parses to html that has the same `id` as the thing you want to swap!



**So the problem nr. 1**

I accidentally sent back something like this:

```tsx
JSON.stringify('<div id="someid">test 123</div>')
// '"<div id=\\"someid\\">test 123</div>"'
```

This is wrong. Note the ID and escape characters! Don’t stringify the string here.

**The problem nr. 2**

You might think you can return something and it will get swapped where you want. Not exactly. The first **`div`** is just information for HTMX on what to do. At least I understand it this way 🤔. 

I’m returning html like this:

```tsx
<div id="conversation" hx-swap-oob="beforeend">
      <AssistantMessage message={response} />
</div>
```

Only **`<AssistantMessage message={response} />`** is appended inside the existing **`<div id="conversation" />`** on the client side.

# End result

<video controls src="/blog-images/chat-with-htmx-websockets-and-hono/lucy-chat-example.mov"></video>


> 💣 Does this post help you? Please spam the like button! Your support is awesome. Thanks!