---
title: 'Creating Lucy: Your Daily Tasks, Delivered with ChatGPT and Todoist Integration'
description: '- iOS Shortcuts: To trigger and manage high level automation.'
pubDate: 'May 15, 2024'
tags: ['LLM', 'Side Projects']
---

# Tools Used:

- iOS Shortcuts: To trigger and manage high level automation.
- [Make.com](http://Make.com): For automation across multiple services.
- ChatGPT: To format messages.
- Todoist: Task management.
- Slack: To receive the task list via custom message. AI assistant interface.

# Step-by-Step Guide

## **Configure [Make.com](http://Make.com) automation:**

In overall this automation looks like this: 

![Untitled](/blog-images/creating-lucy-your-daily-tasks-delivered-with-chatgpt-and-todoist-integration/Untitled.png)

- First setup proper webhook as entrypoint for the automation.
- Next we need to prepare the data we will use. Fetch Todoist tasks and parse the result to JSON. In Todoist block use “make api call” to `/rest/v2/tasks` and set `Query String` to `filter=today | overdue`. I’m using this to fetch only the list of tasks that are from all projects and date is overdue or today.
- Send prepared data to ChatGPT. I’m using Chat Completion here.
    
    Here is the System Message:
    
    ```json
    You are my daily task manager assistant. My name is Kuba. For the provided json list all tasks that are due today or overdue. Prepare a message informing me what is to be done today. 
    
    current time: {{now}}
    
    rules:
    - you can use emoji.
    - don't be too official
    - adjust message to the time of a day
    ```
    
    
>     💡 Look at the `current time` property. There is a variable `now` from [make.com](http://make.com) to make chat aware what time we have. This way messages are more personalised to time of a day. In example sometimes it can suggest the most important task to tackle in the end of the day.
    
    
    
    User Message is just a JSON string prepared in previous step. 
    
- Return the result. I’m using router here to return the result to iOS automation ( for displaying notification on my phone) and to send it to the Slack. I think later I will keep slack only but right now its both.

- **Click here for the blueprint!**
    
    ```json
    {
        "name": "What are todays tasks",
        "flow": [
            {
                "id": 1,
                "module": "gateway:CustomWebHook",
                "version": 1,
                "parameters": {
                    "hook": 1359345,
                    "maxResults": 1
                },
                "mapper": {},
                "metadata": {
                    "designer": {
                        "x": 0,
                        "y": 150
                    },
                    "restore": {
                        "parameters": {
                            "hook": {
                                "data": {
                                    "editable": "true"
                                },
                                "label": "Alice - Todays Plan"
                            }
                        }
                    },
                    "parameters": [
                        {
                            "name": "hook",
                            "type": "hook:gateway-webhook",
                            "label": "Webhook",
                            "required": true
                        },
                        {
                            "name": "maxResults",
                            "type": "number",
                            "label": "Maximum number of results"
                        }
                    ],
                    "interface": [
                        {
                            "name": "requested-date",
                            "type": "text"
                        },
                        {
                            "name": "today",
                            "type": "text"
                        }
                    ]
                }
            },
            {
                "id": 12,
                "module": "todoist:MakeApiCall",
                "version": 2,
                "parameters": {
                    "__IMTCONN__": 2339375
                },
                "mapper": {
                    "qs": [
                        {
                            "key": "filter",
                            "value": "today | overdue"
                        }
                    ],
                    "url": "/rest/v2/tasks",
                    "method": "GET",
                    "headers": [
                        {
                            "key": "Content-Type",
                            "value": "application/json"
                        }
                    ]
                },
                "metadata": {
                    "designer": {
                        "x": 300,
                        "y": 150
                    },
                    "restore": {
                        "expect": {
                            "qs": {
                                "mode": "chose",
                                "items": [
                                    null
                                ]
                            },
                            "method": {
                                "mode": "chose",
                                "label": "GET"
                            },
                            "headers": {
                                "mode": "chose",
                                "items": [
                                    null
                                ]
                            }
                        },
                        "parameters": {
                            "__IMTCONN__": {
                                "data": {
                                    "scoped": "true",
                                    "connection": "todoist"
                                },
                                "label": "Lucy-Make-Todoist-Connection"
                            }
                        }
                    },
                    "parameters": [
                        {
                            "name": "__IMTCONN__",
                            "type": "account:todoist",
                            "label": "Connection",
                            "required": true
                        }
                    ],
                    "expect": [
                        {
                            "name": "url",
                            "type": "text",
                            "label": "URL",
                            "required": true
                        },
                        {
                            "name": "method",
                            "type": "select",
                            "label": "Method",
                            "required": true,
                            "validate": {
                                "enum": [
                                    "GET",
                                    "POST",
                                    "PUT",
                                    "PATCH",
                                    "DELETE"
                                ]
                            }
                        },
                        {
                            "name": "headers",
                            "spec": [
                                {
                                    "name": "key",
                                    "type": "text",
                                    "label": "Key"
                                },
                                {
                                    "name": "value",
                                    "type": "text",
                                    "label": "Value"
                                }
                            ],
                            "type": "array",
                            "label": "Headers"
                        },
                        {
                            "name": "qs",
                            "spec": [
                                {
                                    "name": "key",
                                    "type": "text",
                                    "label": "Key"
                                },
                                {
                                    "name": "value",
                                    "type": "text",
                                    "label": "Value"
                                }
                            ],
                            "type": "array",
                            "label": "Query String"
                        },
                        {
                            "name": "body",
                            "type": "any",
                            "label": "Body"
                        }
                    ]
                }
            },
            {
                "id": 16,
                "module": "json:TransformToJSON",
                "version": 1,
                "parameters": {
                    "space": ""
                },
                "mapper": {
                    "object": "{{12.body}}"
                },
                "metadata": {
                    "designer": {
                        "x": 600,
                        "y": 150
                    },
                    "restore": {
                        "parameters": {
                            "space": {
                                "label": "Empty"
                            }
                        }
                    },
                    "parameters": [
                        {
                            "name": "space",
                            "type": "select",
                            "label": "Indentation",
                            "validate": {
                                "enum": [
                                    "tab",
                                    "2",
                                    "4"
                                ]
                            }
                        }
                    ],
                    "expect": [
                        {
                            "name": "object",
                            "type": "any",
                            "label": "Object"
                        }
                    ]
                }
            },
            {
                "id": 13,
                "module": "openai-gpt-3:CreateCompletion",
                "version": 1,
                "parameters": {
                    "__IMTCONN__": 2545095
                },
                "mapper": {
                    "model": "gpt-4-1106-preview",
                    "top_p": "1",
                    "select": "chat",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are my daily task manager assistant. My name is Kuba. For the provided json list all tasks that are due today or overdue. Prepare a message informing me what is to be done today. \n\ncurrent time: {{now}}\n\nrules:\n- you can use emoji.\n- don't be too official\n- adjust message to the time of a day"
                        },
                        {
                            "role": "user",
                            "content": "{{16.json}}"
                        }
                    ],
                    "max_tokens": "300",
                    "temperature": "1",
                    "n_completions": "1",
                    "response_format": "text"
                },
                "metadata": {
                    "designer": {
                        "x": 900,
                        "y": 150
                    },
                    "restore": {
                        "expect": {
                            "stop": {
                                "mode": "chose"
                            },
                            "model": {
                                "mode": "chose",
                                "label": "gpt-4-1106-preview (system)"
                            },
                            "select": {
                                "label": "Create a Chat Completion (GPT Models)"
                            },
                            "messages": {
                                "mode": "chose",
                                "items": [
                                    {
                                        "role": {
                                            "mode": "chose",
                                            "label": "System"
                                        }
                                    },
                                    {
                                        "role": {
                                            "mode": "chose",
                                            "label": "User"
                                        }
                                    }
                                ]
                            },
                            "logit_bias": {
                                "mode": "chose"
                            },
                            "response_format": {
                                "mode": "chose",
                                "label": "Text"
                            },
                            "additionalParameters": {
                                "mode": "chose"
                            }
                        },
                        "parameters": {
                            "__IMTCONN__": {
                                "data": {
                                    "scoped": "true",
                                    "connection": "openai-gpt-3"
                                },
                                "label": "Lucy (Ask Lucy) - Open AI"
                            }
                        }
                    },
                    "parameters": [
                        {
                            "name": "__IMTCONN__",
                            "type": "account:openai-gpt-3",
                            "label": "Connection",
                            "required": true
                        }
                    ],
                    "expect": [
                        {
                            "name": "select",
                            "type": "select",
                            "label": "Select Method",
                            "required": true,
                            "validate": {
                                "enum": [
                                    "chat",
                                    "prompt"
                                ]
                            }
                        },
                        {
                            "name": "max_tokens",
                            "type": "number",
                            "label": "Max Tokens"
                        },
                        {
                            "name": "temperature",
                            "type": "number",
                            "label": "Temperature",
                            "validate": {
                                "max": 2,
                                "min": 0
                            }
                        },
                        {
                            "name": "top_p",
                            "type": "number",
                            "label": "Top P",
                            "validate": {
                                "max": 1,
                                "min": 0
                            }
                        },
                        {
                            "name": "n_completions",
                            "type": "number",
                            "label": "Number"
                        },
                        {
                            "name": "frequency_penalty",
                            "type": "number",
                            "label": "Frequency Penalty",
                            "validate": {
                                "max": 2,
                                "min": -2
                            }
                        },
                        {
                            "name": "presence_penalty",
                            "type": "number",
                            "label": "Presence Penalty",
                            "validate": {
                                "max": 2,
                                "min": -2
                            }
                        },
                        {
                            "name": "logit_bias",
                            "spec": {
                                "name": "value",
                                "spec": [
                                    {
                                        "name": "token",
                                        "type": "text",
                                        "label": "Token ID",
                                        "required": true
                                    },
                                    {
                                        "name": "probability",
                                        "type": "number",
                                        "label": "Probability",
                                        "required": true,
                                        "validate": {
                                            "max": 100,
                                            "min": -100
                                        }
                                    }
                                ],
                                "type": "collection",
                                "label": "Token Probability"
                            },
                            "type": "array",
                            "label": "Token Probability"
                        },
                        {
                            "name": "response_format",
                            "type": "select",
                            "label": "Response Format",
                            "validate": {
                                "enum": [
                                    "text",
                                    "json_object"
                                ]
                            }
                        },
                        {
                            "name": "seed",
                            "type": "integer",
                            "label": "Seed"
                        },
                        {
                            "name": "stop",
                            "spec": {
                                "name": "value",
                                "type": "text",
                                "label": "Stop Sequence"
                            },
                            "type": "array",
                            "label": "Stop Sequences",
                            "validate": {
                                "maxItems": 4
                            }
                        },
                        {
                            "name": "additionalParameters",
                            "spec": {
                                "name": "value",
                                "spec": [
                                    {
                                        "name": "key",
                                        "type": "text",
                                        "label": "Parameter Name",
                                        "required": true
                                    },
                                    {
                                        "name": "type",
                                        "type": "select",
                                        "label": "Input Type",
                                        "options": [
                                            {
                                                "label": "Text",
                                                "value": "text",
                                                "nested": [
                                                    {
                                                        "name": "value",
                                                        "type": "text",
                                                        "label": "Parameter Value"
                                                    }
                                                ],
                                                "default": true
                                            },
                                            {
                                                "label": "Number",
                                                "value": "number",
                                                "nested": [
                                                    {
                                                        "name": "value",
                                                        "type": "number",
                                                        "label": "Parameter Value"
                                                    }
                                                ]
                                            },
                                            {
                                                "label": "Boolean",
                                                "value": "boolean",
                                                "nested": [
                                                    {
                                                        "name": "value",
                                                        "type": "boolean",
                                                        "label": "Parameter Value"
                                                    }
                                                ]
                                            },
                                            {
                                                "label": "Date",
                                                "value": "date",
                                                "nested": [
                                                    {
                                                        "name": "value",
                                                        "type": "date",
                                                        "label": "Parameter Value"
                                                    }
                                                ]
                                            },
                                            {
                                                "label": "Any",
                                                "value": "any",
                                                "nested": [
                                                    {
                                                        "name": "value",
                                                        "type": "any",
                                                        "label": "Parameter Value"
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ],
                                "type": "collection",
                                "label": "Input Parameter"
                            },
                            "type": "array",
                            "label": "Other Input Parameters"
                        },
                        {
                            "name": "model",
                            "type": "select",
                            "label": "Model",
                            "required": true
                        },
                        {
                            "name": "messages",
                            "spec": {
                                "name": "value",
                                "spec": [
                                    {
                                        "name": "role",
                                        "type": "select",
                                        "label": "Role",
                                        "options": [
                                            {
                                                "label": "System",
                                                "value": "system"
                                            },
                                            {
                                                "label": "User",
                                                "value": "user"
                                            },
                                            {
                                                "label": "Assistant",
                                                "value": "assistant"
                                            }
                                        ],
                                        "required": true
                                    },
                                    {
                                        "name": "content",
                                        "type": "text",
                                        "label": "Message Content"
                                    }
                                ],
                                "type": "collection",
                                "label": "Message"
                            },
                            "type": "array",
                            "label": "Messages",
                            "required": true
                        }
                    ]
                }
            },
            {
                "id": 19,
                "module": "builtin:BasicRouter",
                "version": 1,
                "mapper": null,
                "metadata": {
                    "designer": {
                        "x": 1200,
                        "y": 150
                    }
                },
                "routes": [
                    {
                        "flow": [
                            {
                                "id": 2,
                                "module": "gateway:WebhookRespond",
                                "version": 1,
                                "parameters": {},
                                "mapper": {
                                    "body": "{{13.result}}",
                                    "status": "200",
                                    "headers": []
                                },
                                "metadata": {
                                    "designer": {
                                        "x": 1500,
                                        "y": 0
                                    },
                                    "restore": {
                                        "expect": {
                                            "headers": {
                                                "mode": "chose"
                                            }
                                        }
                                    },
                                    "expect": [
                                        {
                                            "name": "status",
                                            "type": "uinteger",
                                            "label": "Status",
                                            "default": 200,
                                            "required": true,
                                            "validate": {
                                                "min": 100
                                            }
                                        },
                                        {
                                            "name": "body",
                                            "type": "any",
                                            "label": "Body"
                                        },
                                        {
                                            "name": "headers",
                                            "spec": [
                                                {
                                                    "name": "key",
                                                    "type": "text",
                                                    "label": "Key",
                                                    "required": true,
                                                    "validate": {
                                                        "max": 256
                                                    }
                                                },
                                                {
                                                    "name": "value",
                                                    "type": "text",
                                                    "label": "Value",
                                                    "required": true,
                                                    "validate": {
                                                        "max": 4096
                                                    }
                                                }
                                            ],
                                            "type": "array",
                                            "label": "Custom headers",
                                            "advanced": true,
                                            "editable": true,
                                            "validate": {
                                                "maxItems": 16
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    },
                    {
                        "flow": [
                            {
                                "id": 18,
                                "module": "slack:CreateMessage",
                                "version": 4,
                                "parameters": {
                                    "__IMTCONN__": 2545853
                                },
                                "mapper": {
                                    "text": "{{13.result}}",
                                    "parse": false,
                                    "mrkdwn": true,
                                    "channel": "U03KGPFFBCH",
                                    "channelType": "private",
                                    "channelWType": "list"
                                },
                                "metadata": {
                                    "designer": {
                                        "x": 1500,
                                        "y": 300
                                    },
                                    "restore": {
                                        "expect": {
                                            "parse": {
                                                "mode": "chose"
                                            },
                                            "mrkdwn": {
                                                "mode": "chose"
                                            },
                                            "channel": {
                                                "mode": "chose",
                                                "label": "U03KGPFFBCH"
                                            },
                                            "link_names": {
                                                "mode": "chose"
                                            },
                                            "channelType": {
                                                "label": "Private channel"
                                            },
                                            "channelWType": {
                                                "label": "Select from the list"
                                            },
                                            "unfurl_links": {
                                                "mode": "chose"
                                            },
                                            "unfurl_media": {
                                                "mode": "chose"
                                            },
                                            "reply_broadcast": {
                                                "mode": "chose"
                                            }
                                        },
                                        "parameters": {
                                            "__IMTCONN__": {
                                                "data": {
                                                    "scoped": "true",
                                                    "connection": "slack3"
                                                },
                                                "label": "Lucy ( Slack Bot Connection ) (lucy2)"
                                            }
                                        }
                                    },
                                    "parameters": [
                                        {
                                            "name": "__IMTCONN__",
                                            "type": "account:slack2,slack3",
                                            "label": "Connection",
                                            "required": true
                                        }
                                    ],
                                    "expect": [
                                        {
                                            "name": "channelWType",
                                            "type": "select",
                                            "label": "Enter a channel ID or name",
                                            "required": true,
                                            "validate": {
                                                "enum": [
                                                    "manualy",
                                                    "list"
                                                ]
                                            }
                                        },
                                        {
                                            "name": "text",
                                            "type": "text",
                                            "label": "Text"
                                        },
                                        {
                                            "name": "blocks",
                                            "type": "text",
                                            "label": "Blocks"
                                        },
                                        {
                                            "name": "thread_ts",
                                            "type": "text",
                                            "label": "Thread message ID (time stamp)"
                                        },
                                        {
                                            "name": "reply_broadcast",
                                            "type": "boolean",
                                            "label": "Reply broadcast"
                                        },
                                        {
                                            "name": "link_names",
                                            "type": "boolean",
                                            "label": "Link names"
                                        },
                                        {
                                            "name": "parse",
                                            "type": "boolean",
                                            "label": "Parse message text"
                                        },
                                        {
                                            "name": "mrkdwn",
                                            "type": "boolean",
                                            "label": "Use markdown"
                                        },
                                        {
                                            "name": "unfurl_links",
                                            "type": "boolean",
                                            "label": "Unfurl primarily text-based content"
                                        },
                                        {
                                            "name": "unfurl_media",
                                            "type": "boolean",
                                            "label": "Unfurl media content"
                                        },
                                        {
                                            "name": "icon_emoji",
                                            "type": "text",
                                            "label": "Icon emoji"
                                        },
                                        {
                                            "name": "icon_url",
                                            "type": "url",
                                            "label": "Icon url"
                                        },
                                        {
                                            "name": "username",
                                            "type": "text",
                                            "label": "User name"
                                        },
                                        {
                                            "name": "channelType",
                                            "type": "select",
                                            "label": "Channel type",
                                            "required": true,
                                            "validate": {
                                                "enum": [
                                                    "public",
                                                    "private",
                                                    "im",
                                                    "mpim"
                                                ]
                                            }
                                        },
                                        {
                                            "name": "channel",
                                            "type": "select",
                                            "label": "Private channel",
                                            "required": true
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            }
        ],
        "metadata": {
            "instant": true,
            "version": 1,
            "scenario": {
                "roundtrips": 1,
                "maxErrors": 3,
                "autoCommit": true,
                "autoCommitTriggerLast": true,
                "sequential": false,
                "slots": null,
                "confidential": false,
                "dataloss": false,
                "dlq": false,
                "freshVariables": false
            },
            "designer": {
                "orphans": []
            },
            "zone": "eu1.make.com"
        }
    }
    ```
    

## **Configure iOS automation:**

This is quite straightforward. 

- First call [make.com](http://make.com) webhook.
- Use `Show Result` block to show `Contents of URL` from previous block

Adjust automation on your phone to be triggered at specific hours. I’m using 9:00am and 6:00pm to have two checks automated. 

## Example results:


> 💡 Good morning, Kuba! ☕Here's what we've got on the agenda today:

1. Remind … about the boat agreement 🚤

2. Update the training on Motivado 💡

3. Order a new wardrobe 🚪

4. Check the payment for the run 🏃‍♂️Let's tackle these tasks to keep everything on track! Have a productive day!Cheers,

Your Assistant




> 💡 Hey Kuba! 🌟 Evenings are great for some reflection and maybe a bit of catching up, right? I see that you have a task that was due yesterday - you were supposed to "Uzupełnić trening Motivado." It seems like it's slipped by, but no worries, just consider squeezing it in tonight or setting aside time for it tomorrow. Keep up the good vibes! 💪🌙



As you can see it nicely formats longer lists and short ones (like one task). Also it adjusts the message to the time of a day! Another cool thing is that it understands multiple languages so my quick tasks I’m creating in polish language are also correctly translated and fit nicely in message. 

---

Feel free to tweak and enhance the setup to fit your specific needs (use the blueprint!). If you have any questions, suggestions, or would like to share your experience, let me know. Happy automating! 🚀