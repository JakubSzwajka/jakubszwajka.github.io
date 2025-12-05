---
title: 'Creating Lucy: Developing an AI-Powered Slack Assistant with Memory'
description: 'The main idea was to build an AI agent named Lucy that can learn from our conversations and interact through a Slack interface. The plan was also to use no code...'
pubDate: 'May 23, 2024'
tags: ['LLM', 'Side Projects']
---

# Overview

The main idea was to build an AI agent named Lucy that can learn from our conversations and interact through a Slack interface. The plan was also to use no code tool (make.com) and play with embedding and [pinecone.io](http://pinecone.io). So the whole point was to build something that takes this: 

![Untitled](/blog-images/creating-lucy-developing-an-ai-powered-slack-assistant-with-memory/Untitled.png)

And based on automatically creates table like this (I’m using [airtable.com](http://airtable.com) here). 

![Untitled](/blog-images/creating-lucy-developing-an-ai-powered-slack-assistant-with-memory/Untitled%25201.png)

Next I’m able to use those memories to create vectors in pinecone database and use them later in conversations. 


> 💡 Be aware that the idea right now is to keep conversation’s history only until the memories are not distilled from it. Later we are operating only on memories, from this conversation which might lead to loosing some informations. But we can tackle this later…



# Slack API

I won’t dive into the nitty-gritty details here, but the basic idea is simple. Create bot app and enable events api. We will use it to publish events on new messages in certain channel. Also I have turned on direct messages to the app. Then create [make.com](http://make.com) connection and voila. 

# Scenario - Lucy Slack conversation

![Untitled](/blog-images/creating-lucy-developing-an-ai-powered-slack-assistant-with-memory/Untitled%25202.png)

- 📘 Blueprint
    
    ```json
    {
        "name": "Lucy - Slack conversation",
        "flow": [
            {
                "id": 33,
                "module": "gateway:CustomWebHook",
                "version": 1,
                "parameters": {
                    "hook": 1426522,
                    "maxResults": 1
                },
                "mapper": {},
                "metadata": {
                    "designer": {
                        "x": 0,
                        "y": 600,
                        "name": "Listen for a new message event"
                    },
                    "restore": {
                        "parameters": {
                            "hook": {
                                "data": {
                                    "editable": "true"
                                },
                                "label": "On new message to Lucy"
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
                            "name": "token",
                            "type": "text"
                        },
                        {
                            "name": "challenge",
                            "type": "text"
                        },
                        {
                            "name": "type",
                            "type": "text"
                        }
                    ]
                }
            },
            {
                "id": 37,
                "module": "builtin:BasicRouter",
                "version": 1,
                "mapper": null,
                "metadata": {
                    "designer": {
                        "x": 300,
                        "y": 600
                    }
                },
                "routes": [
                    {
                        "flow": [
                            {
                                "id": 34,
                                "module": "gateway:WebhookRespond",
                                "version": 1,
                                "parameters": {},
                                "filter": {
                                    "name": "If event is: url_verification?",
                                    "conditions": [
                                        [
                                            {
                                                "a": "{{33.type}}",
                                                "b": "url_verification",
                                                "o": "text:equal"
                                            }
                                        ]
                                    ]
                                },
                                "mapper": {
                                    "body": "{{33.challenge}}",
                                    "status": "200",
                                    "headers": []
                                },
                                "metadata": {
                                    "designer": {
                                        "x": 600,
                                        "y": 0,
                                        "name": "Return challange"
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
                                "id": 27,
                                "module": "datastore:GetRecord",
                                "version": 1,
                                "parameters": {
                                    "datastore": 45287
                                },
                                "filter": {
                                    "name": "if event is: message",
                                    "conditions": [
                                        [
                                            {
                                                "a": "{{33.event.type}}",
                                                "b": "message",
                                                "o": "text:equal"
                                            },
                                            {
                                                "a": "{{33.type}}",
                                                "b": "event_callback",
                                                "o": "text:equal"
                                            }
                                        ]
                                    ]
                                },
                                "mapper": {
                                    "key": "user_slack_id",
                                    "returnWrapped": false
                                },
                                "metadata": {
                                    "designer": {
                                        "x": 600,
                                        "y": 750
                                    },
                                    "restore": {
                                        "parameters": {
                                            "datastore": {
                                                "label": "Lucy-Mind"
                                            }
                                        }
                                    },
                                    "parameters": [
                                        {
                                            "name": "datastore",
                                            "type": "datastore",
                                            "label": "Data store",
                                            "required": true
                                        }
                                    ],
                                    "expect": [
                                        {
                                            "name": "key",
                                            "type": "text",
                                            "label": "Key",
                                            "required": true
                                        },
                                        {
                                            "name": "returnWrapped",
                                            "type": "boolean",
                                            "label": "Return Wrapped Output",
                                            "required": true
                                        }
                                    ],
                                    "interface": [
                                        {
                                            "name": "value",
                                            "type": "text",
                                            "label": null,
                                            "default": null,
                                            "required": true,
                                            "multiline": false
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 43,
                                "module": "builtin:BasicRouter",
                                "version": 1,
                                "mapper": null,
                                "metadata": {
                                    "designer": {
                                        "x": 900,
                                        "y": 750
                                    }
                                },
                                "routes": [
                                    {
                                        "flow": [
                                            {
                                                "id": 55,
                                                "module": "gateway:WebhookRespond",
                                                "version": 1,
                                                "parameters": {},
                                                "mapper": {
                                                    "body": "Event received!",
                                                    "status": "200",
                                                    "headers": []
                                                },
                                                "metadata": {
                                                    "designer": {
                                                        "x": 1200,
                                                        "y": 300,
                                                        "name": "Return success on webhook handler"
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
                                                "id": 83,
                                                "module": "builtin:BasicRouter",
                                                "version": 1,
                                                "filter": {
                                                    "name": "If message is from the user",
                                                    "conditions": [
                                                        [
                                                            {
                                                                "a": "{{33.event.user}}",
                                                                "b": "{{27.value}}",
                                                                "o": "text:equal"
                                                            }
                                                        ]
                                                    ]
                                                },
                                                "mapper": null,
                                                "metadata": {
                                                    "designer": {
                                                        "x": 1200,
                                                        "y": 750
                                                    }
                                                },
                                                "routes": [
                                                    {
                                                        "flow": [
                                                            {
                                                                "id": 60,
                                                                "module": "airtable:ActionSearchRecords",
                                                                "version": 3,
                                                                "parameters": {
                                                                    "__IMTCONN__": 2550376
                                                                },
                                                                "mapper": {
                                                                    "base": "apptRld5563ZpjbTr",
                                                                    "view": "viw63BN9cucvZjJ1q",
                                                                    "table": "tblOci1y4AkEoy2Sd",
                                                                    "fields": [
                                                                        "author",
                                                                        "message",
                                                                        "created_time"
                                                                    ],
                                                                    "formula": "{synced} = FALSE()",
                                                                    "maxRecords": "10",
                                                                    "useColumnId": false
                                                                },
                                                                "metadata": {
                                                                    "designer": {
                                                                        "x": 1500,
                                                                        "y": 600,
                                                                        "name": "Get not synced conversation history"
                                                                    },
                                                                    "restore": {
                                                                        "expect": {
                                                                            "base": {
                                                                                "mode": "chose",
                                                                                "label": "Lucy"
                                                                            },
                                                                            "sort": {
                                                                                "mode": "chose"
                                                                            },
                                                                            "view": {
                                                                                "mode": "chose",
                                                                                "label": "Grid view"
                                                                            },
                                                                            "table": {
                                                                                "mode": "chose",
                                                                                "label": "ConversationHistory"
                                                                            },
                                                                            "fields": {
                                                                                "mode": "chose",
                                                                                "label": [
                                                                                    "author",
                                                                                    "message",
                                                                                    "created_time"
                                                                                ]
                                                                            },
                                                                            "useColumnId": {
                                                                                "mode": "chose"
                                                                            }
                                                                        },
                                                                        "parameters": {
                                                                            "__IMTCONN__": {
                                                                                "data": {
                                                                                    "scoped": "true",
                                                                                    "connection": "airtable3"
                                                                                },
                                                                                "label": "Make.com - Airtable (User ID: usr5oojEFDMW9OW2V)"
                                                                            }
                                                                        }
                                                                    },
                                                                    "parameters": [
                                                                        {
                                                                            "name": "__IMTCONN__",
                                                                            "type": "account:airtable3,airtable2",
                                                                            "label": "Connection",
                                                                            "required": true
                                                                        }
                                                                    ],
                                                                    "expect": [
                                                                        {
                                                                            "name": "base",
                                                                            "type": "select",
                                                                            "label": "Base",
                                                                            "required": true
                                                                        },
                                                                        {
                                                                            "name": "useColumnId",
                                                                            "type": "boolean",
                                                                            "label": "Use Column ID",
                                                                            "required": true
                                                                        },
                                                                        {
                                                                            "name": "table",
                                                                            "type": "select",
                                                                            "label": "Table",
                                                                            "required": true
                                                                        },
                                                                        {
                                                                            "name": "formula",
                                                                            "type": "text",
                                                                            "label": "Formula"
                                                                        },
                                                                        {
                                                                            "name": "maxRecords",
                                                                            "type": "integer",
                                                                            "label": "Limit"
                                                                        },
                                                                        {
                                                                            "name": "sort",
                                                                            "spec": [
                                                                                {
                                                                                    "name": "field",
                                                                                    "type": "select",
                                                                                    "label": "Field",
                                                                                    "dynamic": true,
                                                                                    "options": []
                                                                                },
                                                                                {
                                                                                    "name": "direction",
                                                                                    "type": "select",
                                                                                    "label": "Direction",
                                                                                    "options": [
                                                                                        {
                                                                                            "label": "Descending",
                                                                                            "value": "desc"
                                                                                        },
                                                                                        {
                                                                                            "label": "Ascending",
                                                                                            "value": "asc"
                                                                                        }
                                                                                    ]
                                                                                }
                                                                            ],
                                                                            "type": "array",
                                                                            "label": "Sort"
                                                                        },
                                                                        {
                                                                            "name": "view",
                                                                            "type": "select",
                                                                            "label": "View"
                                                                        },
                                                                        {
                                                                            "name": "fields",
                                                                            "type": "select",
                                                                            "label": "Output Fields",
                                                                            "multiple": true
                                                                        }
                                                                    ],
                                                                    "interface": [
                                                                        {
                                                                            "name": "__IMTLENGTH__",
                                                                            "type": "uinteger",
                                                                            "label": "Total number of bundles"
                                                                        },
                                                                        {
                                                                            "name": "__IMTINDEX__",
                                                                            "type": "uinteger",
                                                                            "label": "Bundle order position"
                                                                        },
                                                                        {
                                                                            "name": "id",
                                                                            "type": "text",
                                                                            "label": "ID"
                                                                        },
                                                                        {
                                                                            "name": "createdTime",
                                                                            "type": "date",
                                                                            "label": "Created Time"
                                                                        },
                                                                        {
                                                                            "name": "author",
                                                                            "spec": [
                                                                                {
                                                                                    "name": "id",
                                                                                    "type": "text",
                                                                                    "label": "ID"
                                                                                },
                                                                                {
                                                                                    "name": "email",
                                                                                    "type": "email",
                                                                                    "label": "Email"
                                                                                },
                                                                                {
                                                                                    "name": "name",
                                                                                    "type": "text",
                                                                                    "label": "Name"
                                                                                }
                                                                            ],
                                                                            "type": "collection",
                                                                            "label": "author"
                                                                        },
                                                                        {
                                                                            "name": "message",
                                                                            "type": "text",
                                                                            "label": "message",
                                                                            "multiline": true
                                                                        },
                                                                        {
                                                                            "name": "created_time",
                                                                            "type": "date",
                                                                            "label": "created_time"
                                                                        }
                                                                    ]
                                                                }
                                                            },
                                                            {
                                                                "id": 63,
                                                                "module": "builtin:BasicAggregator",
                                                                "version": 1,
                                                                "parameters": {
                                                                    "feeder": 60
                                                                },
                                                                "mapper": {
                                                                    "author": "{{60.author}}",
                                                                    "message": "{{60.message}}",
                                                                    "created_time": "{{60.created_time}}"
                                                                },
                                                                "metadata": {
                                                                    "designer": {
                                                                        "x": 1800,
                                                                        "y": 600
                                                                    },
                                                                    "restore": {
                                                                        "extra": {
                                                                            "feeder": {
                                                                                "label": "Airtable - Search Records [60]"
                                                                            },
                                                                            "target": {
                                                                                "label": "Custom"
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            },
                                                            {
                                                                "id": 64,
                                                                "module": "builtin:BasicFeeder",
                                                                "version": 1,
                                                                "parameters": {},
                                                                "mapper": {
                                                                    "array": "{{63.array}}"
                                                                },
                                                                "metadata": {
                                                                    "designer": {
                                                                        "x": 2100,
                                                                        "y": 600
                                                                    },
                                                                    "restore": {
                                                                        "expect": {
                                                                            "array": {
                                                                                "mode": "edit"
                                                                            }
                                                                        }
                                                                    },
                                                                    "expect": [
                                                                        {
                                                                            "mode": "edit",
                                                                            "name": "array",
                                                                            "spec": [],
                                                                            "type": "array",
                                                                            "label": "Array"
                                                                        }
                                                                    ]
                                                                }
                                                            },
                                                            {
                                                                "id": 62,
                                                                "module": "util:TextAggregator",
                                                                "version": 1,
                                                                "parameters": {
                                                                    "feeder": 64,
                                                                    "rowSeparator": ""
                                                                },
                                                                "mapper": {
                                                                    "value": "{{64.author.name}} ({{64.created_time}}): {{64.message}} {{newline}}"
                                                                },
                                                                "metadata": {
                                                                    "designer": {
                                                                        "x": 2400,
                                                                        "y": 600
                                                                    },
                                                                    "restore": {
                                                                        "extra": {
                                                                            "feeder": {
                                                                                "label": "Iterator [64]"
                                                                            }
                                                                        },
                                                                        "parameters": {
                                                                            "rowSeparator": {
                                                                                "label": "Empty"
                                                                            }
                                                                        }
                                                                    },
                                                                    "parameters": [
                                                                        {
                                                                            "name": "rowSeparator",
                                                                            "type": "select",
                                                                            "label": "Row separator",
                                                                            "validate": {
                                                                                "enum": [
                                                                                    "\n",
                                                                                    "\t",
                                                                                    "other"
                                                                                ]
                                                                            }
                                                                        }
                                                                    ],
                                                                    "expect": [
                                                                        {
                                                                            "name": "value",
                                                                            "type": "text",
                                                                            "label": "Text"
                                                                        }
                                                                    ]
                                                                }
                                                            },
                                                            {
                                                                "id": 65,
                                                                "module": "util:SetVariable2",
                                                                "version": 1,
                                                                "parameters": {},
                                                                "mapper": {
                                                                    "name": "conversation_history",
                                                                    "scope": "roundtrip",
                                                                    "value": "{{62.text}}"
                                                                },
                                                                "metadata": {
                                                                    "designer": {
                                                                        "x": 2700,
                                                                        "y": 600
                                                                    },
                                                                    "restore": {
                                                                        "expect": {
                                                                            "scope": {
                                                                                "label": "One cycle"
                                                                            }
                                                                        }
                                                                    },
                                                                    "expect": [
                                                                        {
                                                                            "name": "name",
                                                                            "type": "text",
                                                                            "label": "Variable name",
                                                                            "required": true
                                                                        },
                                                                        {
                                                                            "name": "scope",
                                                                            "type": "select",
                                                                            "label": "Variable lifetime",
                                                                            "required": true,
                                                                            "validate": {
                                                                                "enum": [
                                                                                    "roundtrip",
                                                                                    "execution"
                                                                                ]
                                                                            }
                                                                        },
                                                                        {
                                                                            "name": "value",
                                                                            "type": "any",
                                                                            "label": "Variable value"
                                                                        }
                                                                    ],
                                                                    "interface": [
                                                                        {
                                                                            "name": "conversation_history",
                                                                            "type": "any",
                                                                            "label": "conversation_history"
                                                                        }
                                                                    ]
                                                                }
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "flow": [
                                                            {
                                                                "id": 67,
                                                                "module": "util:GetVariable2",
                                                                "version": 1,
                                                                "parameters": {},
                                                                "mapper": {
                                                                    "name": "conversation_history"
                                                                },
                                                                "metadata": {
                                                                    "designer": {
                                                                        "x": 1500,
                                                                        "y": 900,
                                                                        "name": "Get Conversation History"
                                                                    },
                                                                    "restore": {},
                                                                    "expect": [
                                                                        {
                                                                            "name": "name",
                                                                            "type": "text",
                                                                            "label": "Variable name",
                                                                            "required": true
                                                                        }
                                                                    ],
                                                                    "interface": [
                                                                        {
                                                                            "name": "conversation_history",
                                                                            "type": "any",
                                                                            "label": "conversation_history"
                                                                        }
                                                                    ]
                                                                }
                                                            },
                                                            {
                                                                "id": 76,
                                                                "module": "json:CreateJSON",
                                                                "version": 1,
                                                                "parameters": {
                                                                    "type": 165928,
                                                                    "space": ""
                                                                },
                                                                "mapper": {
                                                                    "input": "{{33.event.text}}",
                                                                    "model": "text-embedding-ada-002"
                                                                },
                                                                "metadata": {
                                                                    "designer": {
                                                                        "x": 1800,
                                                                        "y": 900,
                                                                        "name": "Embedding JSON"
                                                                    },
                                                                    "restore": {
                                                                        "parameters": {
                                                                            "type": {
                                                                                "label": "Embedding"
                                                                            },
                                                                            "space": {
                                                                                "label": "Empty"
                                                                            }
                                                                        }
                                                                    },
                                                                    "parameters": [
                                                                        {
                                                                            "name": "type",
                                                                            "type": "udt",
                                                                            "label": "Data structure",
                                                                            "required": true
                                                                        },
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
                                                                            "name": "input",
                                                                            "type": "text",
                                                                            "label": "Input"
                                                                        },
                                                                        {
                                                                            "name": "model",
                                                                            "type": "text",
                                                                            "label": "Model"
                                                                        }
                                                                    ]
                                                                }
                                                            },
                                                            {
                                                                "id": 75,
                                                                "module": "openai-gpt-3:makeApiCall",
                                                                "version": 1,
                                                                "parameters": {
                                                                    "__IMTCONN__": 2545095
                                                                },
                                                                "mapper": {
                                                                    "url": "/v1/embeddings",
                                                                    "body": "{{76.json}}",
                                                                    "method": "POST",
                                                                    "headers": [
                                                                        {
                                                                            "key": "Content-Type",
                                                                            "value": "application/json"
                                                                        }
                                                                    ]
                                                                },
                                                                "metadata": {
                                                                    "designer": {
                                                                        "x": 2100,
                                                                        "y": 900
                                                                    },
                                                                    "restore": {
                                                                        "expect": {
                                                                            "qs": {
                                                                                "mode": "chose"
                                                                            },
                                                                            "method": {
                                                                                "mode": "chose",
                                                                                "label": "POST"
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
                                                                                    "connection": "openai-gpt-3"
                                                                                },
                                                                                "label": "Make.com - Open AI"
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
                                                                            "spec": {
                                                                                "name": "value",
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
                                                                                "type": "collection",
                                                                                "label": "Header"
                                                                            },
                                                                            "type": "array",
                                                                            "label": "Headers"
                                                                        },
                                                                        {
                                                                            "name": "qs",
                                                                            "spec": {
                                                                                "name": "value",
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
                                                                                "type": "collection",
                                                                                "label": "Query String"
                                                                            },
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
                                                                "id": 78,
                                                                "module": "pinecone:searchIds",
                                                                "version": 1,
                                                                "parameters": {
                                                                    "__IMTCONN__": 2619315
                                                                },
                                                                "mapper": {
                                                                    "limit": "3",
                                                                    "vector": "{{75.body.data[].embedding}}",
                                                                    "namespace": "memories",
                                                                    "sparseVector": {},
                                                                    "includeMetadata": true
                                                                },
                                                                "metadata": {
                                                                    "designer": {
                                                                        "x": 2400,
                                                                        "y": 900
                                                                    },
                                                                    "restore": {
                                                                        "expect": {
                                                                            "vector": {
                                                                                "mode": "edit"
                                                                            },
                                                                            "filterType": {
                                                                                "label": "Empty"
                                                                            },
                                                                            "sparseVector": {
                                                                                "nested": {
                                                                                    "values": {
                                                                                        "mode": "chose"
                                                                                    },
                                                                                    "indices": {
                                                                                        "mode": "chose"
                                                                                    }
                                                                                }
                                                                            },
                                                                            "includeValues": {
                                                                                "mode": "chose"
                                                                            },
                                                                            "includeMetadata": {
                                                                                "mode": "chose"
                                                                            }
                                                                        },
                                                                        "parameters": {
                                                                            "__IMTCONN__": {
                                                                                "data": {
                                                                                    "scoped": "true",
                                                                                    "connection": "pinecone"
                                                                                },
                                                                                "label": "My Pinecone connection"
                                                                            }
                                                                        }
                                                                    },
                                                                    "parameters": [
                                                                        {
                                                                            "name": "__IMTCONN__",
                                                                            "type": "account:pinecone",
                                                                            "label": "Connection",
                                                                            "required": true
                                                                        }
                                                                    ],
                                                                    "expect": [
                                                                        {
                                                                            "name": "vector",
                                                                            "spec": {
                                                                                "name": "value",
                                                                                "type": "number",
                                                                                "label": "Value"
                                                                            },
                                                                            "type": "array",
                                                                            "label": "Vector"
                                                                        },
                                                                        {
                                                                            "name": "id",
                                                                            "type": "text",
                                                                            "label": "Vector ID"
                                                                        },
                                                                        {
                                                                            "name": "namespace",
                                                                            "type": "text",
                                                                            "label": "Namespace"
                                                                        },
                                                                        {
                                                                            "name": "filterType",
                                                                            "type": "select",
                                                                            "label": "Filter Type",
                                                                            "validate": {
                                                                                "enum": [
                                                                                    "simple",
                                                                                    "custom"
                                                                                ]
                                                                            }
                                                                        },
                                                                        {
                                                                            "name": "includeValues",
                                                                            "type": "boolean",
                                                                            "label": "Include Values"
                                                                        },
                                                                        {
                                                                            "name": "includeMetadata",
                                                                            "type": "boolean",
                                                                            "label": "Include Metadata"
                                                                        },
                                                                        {
                                                                            "name": "sparseVector",
                                                                            "spec": [
                                                                                {
                                                                                    "name": "indices",
                                                                                    "spec": {
                                                                                        "name": "value",
                                                                                        "type": "integer",
                                                                                        "label": "Index"
                                                                                    },
                                                                                    "type": "array",
                                                                                    "label": "Indices"
                                                                                },
                                                                                {
                                                                                    "name": "values",
                                                                                    "spec": {
                                                                                        "name": "value",
                                                                                        "type": "number",
                                                                                        "label": "Value"
                                                                                    },
                                                                                    "type": "array",
                                                                                    "label": "Values"
                                                                                }
                                                                            ],
                                                                            "type": "collection",
                                                                            "label": "Sparse Vector"
                                                                        },
                                                                        {
                                                                            "name": "limit",
                                                                            "type": "uinteger",
                                                                            "label": "Limit",
                                                                            "required": true
                                                                        }
                                                                    ]
                                                                }
                                                            },
                                                            {
                                                                "id": 80,
                                                                "module": "util:TextAggregator",
                                                                "version": 1,
                                                                "parameters": {
                                                                    "feeder": 78,
                                                                    "rowSeparator": "other",
                                                                    "otherRowSeparator": ","
                                                                },
                                                                "mapper": {
                                                                    "value": "{{78.metadata.id}}"
                                                                },
                                                                "metadata": {
                                                                    "designer": {
                                                                        "x": 2700,
                                                                        "y": 900,
                                                                        "name": "Gather IDs"
                                                                    },
                                                                    "restore": {
                                                                        "extra": {
                                                                            "feeder": {
                                                                                "label": "Pinecone - Query Vectors [78]"
                                                                            }
                                                                        },
                                                                        "parameters": {
                                                                            "rowSeparator": {
                                                                                "label": "Other"
                                                                            }
                                                                        }
                                                                    },
                                                                    "parameters": [
                                                                        {
                                                                            "name": "rowSeparator",
                                                                            "type": "select",
                                                                            "label": "Row separator",
                                                                            "validate": {
                                                                                "enum": [
                                                                                    "\n",
                                                                                    "\t",
                                                                                    "other"
                                                                                ]
                                                                            }
                                                                        },
                                                                        {
                                                                            "name": "otherRowSeparator",
                                                                            "type": "text",
                                                                            "label": "Separator"
                                                                        }
                                                                    ],
                                                                    "expect": [
                                                                        {
                                                                            "name": "value",
                                                                            "type": "text",
                                                                            "label": "Text"
                                                                        }
                                                                    ],
                                                                    "advanced": true
                                                                },
                                                                "flags": {
                                                                    "stopIfEmpty": true
                                                                }
                                                            },
                                                            {
                                                                "id": 81,
                                                                "module": "airtable:ActionSearchRecords",
                                                                "version": 3,
                                                                "parameters": {
                                                                    "__IMTCONN__": 2550376
                                                                },
                                                                "mapper": {
                                                                    "base": "apptRld5563ZpjbTr",
                                                                    "view": "viwf0po8sbWVkeghF",
                                                                    "table": "tblayy4f4EHXxAEAw",
                                                                    "fields": [
                                                                        "record_id",
                                                                        "content"
                                                                    ],
                                                                    "formula": "IF(SEARCH({record_id}, \"{{80.text}}\"), 1, 0)",
                                                                    "maxRecords": "10",
                                                                    "useColumnId": false
                                                                },
                                                                "metadata": {
                                                                    "designer": {
                                                                        "x": 3000,
                                                                        "y": 900,
                                                                        "name": "Gather Context"
                                                                    },
                                                                    "restore": {
                                                                        "expect": {
                                                                            "base": {
                                                                                "mode": "chose",
                                                                                "label": "Lucy"
                                                                            },
                                                                            "sort": {
                                                                                "mode": "chose"
                                                                            },
                                                                            "view": {
                                                                                "mode": "chose",
                                                                                "label": "Grid view"
                                                                            },
                                                                            "table": {
                                                                                "mode": "chose",
                                                                                "label": "Memories"
                                                                            },
                                                                            "fields": {
                                                                                "mode": "chose",
                                                                                "label": [
                                                                                    "record_id",
                                                                                    "content"
                                                                                ]
                                                                            },
                                                                            "useColumnId": {
                                                                                "mode": "chose"
                                                                            }
                                                                        },
                                                                        "parameters": {
                                                                            "__IMTCONN__": {
                                                                                "data": {
                                                                                    "scoped": "true",
                                                                                    "connection": "airtable3"
                                                                                },
                                                                                "label": "Make.com - Airtable (User ID: usr5oojEFDMW9OW2V)"
                                                                            }
                                                                        }
                                                                    },
                                                                    "parameters": [
                                                                        {
                                                                            "name": "__IMTCONN__",
                                                                            "type": "account:airtable3,airtable2",
                                                                            "label": "Connection",
                                                                            "required": true
                                                                        }
                                                                    ],
                                                                    "expect": [
                                                                        {
                                                                            "name": "base",
                                                                            "type": "select",
                                                                            "label": "Base",
                                                                            "required": true
                                                                        },
                                                                        {
                                                                            "name": "useColumnId",
                                                                            "type": "boolean",
                                                                            "label": "Use Column ID",
                                                                            "required": true
                                                                        },
                                                                        {
                                                                            "name": "table",
                                                                            "type": "select",
                                                                            "label": "Table",
                                                                            "required": true
                                                                        },
                                                                        {
                                                                            "name": "formula",
                                                                            "type": "text",
                                                                            "label": "Formula"
                                                                        },
                                                                        {
                                                                            "name": "maxRecords",
                                                                            "type": "integer",
                                                                            "label": "Limit"
                                                                        },
                                                                        {
                                                                            "name": "sort",
                                                                            "spec": [
                                                                                {
                                                                                    "name": "field",
                                                                                    "type": "select",
                                                                                    "label": "Field",
                                                                                    "dynamic": true,
                                                                                    "options": []
                                                                                },
                                                                                {
                                                                                    "name": "direction",
                                                                                    "type": "select",
                                                                                    "label": "Direction",
                                                                                    "options": [
                                                                                        {
                                                                                            "label": "Descending",
                                                                                            "value": "desc"
                                                                                        },
                                                                                        {
                                                                                            "label": "Ascending",
                                                                                            "value": "asc"
                                                                                        }
                                                                                    ]
                                                                                }
                                                                            ],
                                                                            "type": "array",
                                                                            "label": "Sort"
                                                                        },
                                                                        {
                                                                            "name": "view",
                                                                            "type": "select",
                                                                            "label": "View"
                                                                        },
                                                                        {
                                                                            "name": "fields",
                                                                            "type": "select",
                                                                            "label": "Output Fields",
                                                                            "multiple": true
                                                                        }
                                                                    ],
                                                                    "interface": [
                                                                        {
                                                                            "name": "__IMTLENGTH__",
                                                                            "type": "uinteger",
                                                                            "label": "Total number of bundles"
                                                                        },
                                                                        {
                                                                            "name": "__IMTINDEX__",
                                                                            "type": "uinteger",
                                                                            "label": "Bundle order position"
                                                                        },
                                                                        {
                                                                            "name": "id",
                                                                            "type": "text",
                                                                            "label": "ID"
                                                                        },
                                                                        {
                                                                            "name": "createdTime",
                                                                            "type": "date",
                                                                            "label": "Created Time"
                                                                        },
                                                                        {
                                                                            "name": "record_id",
                                                                            "type": "text",
                                                                            "label": "record_id"
                                                                        },
                                                                        {
                                                                            "name": "content",
                                                                            "type": "text",
                                                                            "label": "content",
                                                                            "multiline": true
                                                                        }
                                                                    ]
                                                                }
                                                            },
                                                            {
                                                                "id": 82,
                                                                "module": "util:TextAggregator",
                                                                "version": 1,
                                                                "parameters": {
                                                                    "feeder": 81,
                                                                    "rowSeparator": "other",
                                                                    "otherRowSeparator": "\\n\\n\\n"
                                                                },
                                                                "mapper": {
                                                                    "value": "{{81.content}}"
                                                                },
                                                                "metadata": {
                                                                    "designer": {
                                                                        "x": 3300,
                                                                        "y": 900,
                                                                        "name": "Gather Context"
                                                                    },
                                                                    "restore": {
                                                                        "extra": {
                                                                            "feeder": {
                                                                                "label": "Gather Context - Search Records [20]"
                                                                            }
                                                                        },
                                                                        "parameters": {
                                                                            "rowSeparator": {
                                                                                "label": "Other"
                                                                            }
                                                                        }
                                                                    },
                                                                    "parameters": [
                                                                        {
                                                                            "name": "rowSeparator",
                                                                            "type": "select",
                                                                            "label": "Row separator",
                                                                            "validate": {
                                                                                "enum": [
                                                                                    "\n",
                                                                                    "\t",
                                                                                    "other"
                                                                                ]
                                                                            }
                                                                        },
                                                                        {
                                                                            "name": "otherRowSeparator",
                                                                            "type": "text",
                                                                            "label": "Separator"
                                                                        }
                                                                    ],
                                                                    "expect": [
                                                                        {
                                                                            "name": "value",
                                                                            "type": "text",
                                                                            "label": "Text"
                                                                        }
                                                                    ],
                                                                    "advanced": true
                                                                }
                                                            },
                                                            {
                                                                "id": 30,
                                                                "module": "openai-gpt-3:CreateCompletion",
                                                                "version": 1,
                                                                "parameters": {
                                                                    "__IMTCONN__": 2545095
                                                                },
                                                                "mapper": {
                                                                    "model": "gpt-4o",
                                                                    "top_p": "1",
                                                                    "select": "chat",
                                                                    "messages": [
                                                                        {
                                                                            "role": "system",
                                                                            "content": "You are an AI assistant called Lucy, designed for ultra-concise, engaging conversations. Follow these rules:\n\n- Use the fewest words possible while maintaining clarity, impact and natural language\n- Keep a friendly, casual tone with occasional colloquialisms\n- Format responses in Markdown or JSON, like `**bold**` or `{\"key\": \"value\"}`\n- Always wrap code with triple backticks and keywords with `single backticks`\n- Ask for clarification to avoid assumptions\n- Detect intentions and emotional states to tailor responses perfectly.\n- Focus solely on instructions and provide relevant, comprehensive responses\n- Never repeat info or mention limitations\n- Simplify complex tasks; provide the best output possible\n- Prioritize user needs; tailor responses to their context and goals\n- When asked for specific content, start response with requested info immediately\n- Continuously improve based on user feedback\n\nNote: \n- Current Date (YYYY/MM/DD, HH:MM:SS): {{now}}\n\nExamples of an expected behaviour:\n\nUser: Brainstorm 3 unique business ideas.\nAI: 1. **Smart Kitchenware:** IoT-connected cooking tools for effortless meals.\n2. **VR Fitness Studio:** Immersive virtual workouts with personal trainers.\n3. **Eco-Friendly Meal Kits:** Zero-waste ingredients for sustainable cooking.\n\nUser: Write a haiku about the ocean.\nAI: Vast blue horizon\nWaves whisper ancient secrets\nDepths hold mysteries\n\nUser: Suggest a catchy slogan for a new energy drink.\nAI: \"Ignite Your Potential\" - Energy Unleashed! \n\nUser: What's the weather like in New York today? Answer using JSON.\nAI: {\n  \"city\": \"New York\",\n  \"condition\": \"Partly cloudy\",\n  \"temperature\": \"72°F (22°C)\",\n  \"humidity\": \"60%\",\n  \"wind\": \"8 mph (13 km/h)\"\n}\n\nUser: How can I improve my public speaking skills?\nAI: Tell me more about yourself first.\n\nUSER: Write a JavaScript function that generates a random number within a given range.\nAI:\n```javascript\nfunction getRandomNum(min, max) {\n  return Math.floor(Math.random() * (max - min + 1)) + min;\n}\n```\n\n\nLet's keep it ultra-concise and engaging!\n\n### conversation_history: {{67.conversation_history}}\n\n### context\n{{82.text}}\n\n"
                                                                        },
                                                                        {
                                                                            "role": "user",
                                                                            "content": "{{33.event.text}}"
                                                                        }
                                                                    ],
                                                                    "max_tokens": "300",
                                                                    "temperature": "1",
                                                                    "n_completions": "1",
                                                                    "response_format": "text"
                                                                },
                                                                "metadata": {
                                                                    "designer": {
                                                                        "x": 3600,
                                                                        "y": 900
                                                                    },
                                                                    "restore": {
                                                                        "expect": {
                                                                            "stop": {
                                                                                "mode": "chose"
                                                                            },
                                                                            "model": {
                                                                                "mode": "chose",
                                                                                "label": "gpt-4o (system)"
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
                                                                                "label": "Make.com - Open AI"
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
                                                                            "label": "Max Tokens",
                                                                            "required": true
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
                                                                "id": 31,
                                                                "module": "slack:CreateMessage",
                                                                "version": 4,
                                                                "parameters": {
                                                                    "__IMTCONN__": 2545853
                                                                },
                                                                "mapper": {
                                                                    "text": "{{30.result}}",
                                                                    "parse": false,
                                                                    "mrkdwn": true,
                                                                    "channel": "{{27.value}}",
                                                                    "channelWType": "manualy"
                                                                },
                                                                "metadata": {
                                                                    "designer": {
                                                                        "x": 3900,
                                                                        "y": 900
                                                                    },
                                                                    "restore": {
                                                                        "expect": {
                                                                            "parse": {
                                                                                "mode": "chose"
                                                                            },
                                                                            "mrkdwn": {
                                                                                "mode": "chose"
                                                                            },
                                                                            "link_names": {
                                                                                "mode": "chose"
                                                                            },
                                                                            "channelWType": {
                                                                                "label": "Enter manually"
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
                                                                                "label": "Make.com - Lucy ( Slack Bot Connection ) (lucy2)"
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
                                                                            "name": "channel",
                                                                            "type": "text",
                                                                            "label": "Channel ID or name",
                                                                            "required": true
                                                                        },
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
                                                                            "name": "channel",
                                                                            "type": "text",
                                                                            "label": "Channel ID or name",
                                                                            "required": true
                                                                        }
                                                                    ]
                                                                }
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "flow": [
                                            {
                                                "id": 57,
                                                "module": "airtable:ActionSearchRecords",
                                                "version": 3,
                                                "parameters": {
                                                    "__IMTCONN__": 2550376
                                                },
                                                "mapper": {
                                                    "base": "apptRld5563ZpjbTr",
                                                    "view": "viw2orQgTjhI7Dgov",
                                                    "table": "tblRTkZgmZDxgAyee",
                                                    "fields": [
                                                        "record_id",
                                                        "user",
                                                        "slack_user_id",
                                                        "slack_bot_id"
                                                    ],
                                                    "formula": "{slack_user_id} = \"{{33.event.user}}\"",
                                                    "maxRecords": "1",
                                                    "useColumnId": false
                                                },
                                                "metadata": {
                                                    "designer": {
                                                        "x": 1200,
                                                        "y": 1200,
                                                        "name": "Get User Data"
                                                    },
                                                    "restore": {
                                                        "expect": {
                                                            "base": {
                                                                "mode": "chose",
                                                                "label": "Lucy"
                                                            },
                                                            "sort": {
                                                                "mode": "chose"
                                                            },
                                                            "view": {
                                                                "mode": "chose",
                                                                "label": "Grid view"
                                                            },
                                                            "table": {
                                                                "mode": "chose",
                                                                "label": "Users"
                                                            },
                                                            "fields": {
                                                                "mode": "chose",
                                                                "label": [
                                                                    "record_id",
                                                                    "user",
                                                                    "slack_user_id",
                                                                    "slack_bot_id"
                                                                ]
                                                            },
                                                            "useColumnId": {
                                                                "mode": "chose"
                                                            }
                                                        },
                                                        "parameters": {
                                                            "__IMTCONN__": {
                                                                "data": {
                                                                    "scoped": "true",
                                                                    "connection": "airtable3"
                                                                },
                                                                "label": "Make.com - Airtable (User ID: usr5oojEFDMW9OW2V)"
                                                            }
                                                        }
                                                    },
                                                    "parameters": [
                                                        {
                                                            "name": "__IMTCONN__",
                                                            "type": "account:airtable3,airtable2",
                                                            "label": "Connection",
                                                            "required": true
                                                        }
                                                    ],
                                                    "expect": [
                                                        {
                                                            "name": "base",
                                                            "type": "select",
                                                            "label": "Base",
                                                            "required": true
                                                        },
                                                        {
                                                            "name": "useColumnId",
                                                            "type": "boolean",
                                                            "label": "Use Column ID",
                                                            "required": true
                                                        },
                                                        {
                                                            "name": "table",
                                                            "type": "select",
                                                            "label": "Table",
                                                            "required": true
                                                        },
                                                        {
                                                            "name": "formula",
                                                            "type": "text",
                                                            "label": "Formula"
                                                        },
                                                        {
                                                            "name": "maxRecords",
                                                            "type": "integer",
                                                            "label": "Limit"
                                                        },
                                                        {
                                                            "name": "sort",
                                                            "spec": [
                                                                {
                                                                    "name": "field",
                                                                    "type": "select",
                                                                    "label": "Field",
                                                                    "dynamic": true,
                                                                    "options": []
                                                                },
                                                                {
                                                                    "name": "direction",
                                                                    "type": "select",
                                                                    "label": "Direction",
                                                                    "options": [
                                                                        {
                                                                            "label": "Descending",
                                                                            "value": "desc"
                                                                        },
                                                                        {
                                                                            "label": "Ascending",
                                                                            "value": "asc"
                                                                        }
                                                                    ]
                                                                }
                                                            ],
                                                            "type": "array",
                                                            "label": "Sort"
                                                        },
                                                        {
                                                            "name": "view",
                                                            "type": "select",
                                                            "label": "View"
                                                        },
                                                        {
                                                            "name": "fields",
                                                            "type": "select",
                                                            "label": "Output Fields",
                                                            "multiple": true
                                                        }
                                                    ],
                                                    "interface": [
                                                        {
                                                            "name": "__IMTLENGTH__",
                                                            "type": "uinteger",
                                                            "label": "Total number of bundles"
                                                        },
                                                        {
                                                            "name": "__IMTINDEX__",
                                                            "type": "uinteger",
                                                            "label": "Bundle order position"
                                                        },
                                                        {
                                                            "name": "id",
                                                            "type": "text",
                                                            "label": "ID"
                                                        },
                                                        {
                                                            "name": "createdTime",
                                                            "type": "date",
                                                            "label": "Created Time"
                                                        },
                                                        {
                                                            "name": "record_id",
                                                            "type": "text",
                                                            "label": "record_id"
                                                        },
                                                        {
                                                            "name": "user",
                                                            "spec": [
                                                                {
                                                                    "name": "id",
                                                                    "type": "text",
                                                                    "label": "ID"
                                                                },
                                                                {
                                                                    "name": "email",
                                                                    "type": "email",
                                                                    "label": "Email"
                                                                },
                                                                {
                                                                    "name": "name",
                                                                    "type": "text",
                                                                    "label": "Name"
                                                                }
                                                            ],
                                                            "type": "collection",
                                                            "label": "user"
                                                        },
                                                        {
                                                            "name": "slack_user_id",
                                                            "type": "text",
                                                            "label": "slack_user_id"
                                                        },
                                                        {
                                                            "name": "slack_bot_id",
                                                            "type": "text",
                                                            "label": "slack_bot_id"
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                "id": 58,
                                                "module": "airtable:ActionCreateRecord",
                                                "version": 3,
                                                "parameters": {
                                                    "__IMTCONN__": 2550376
                                                },
                                                "mapper": {
                                                    "base": "apptRld5563ZpjbTr",
                                                    "table": "tblOci1y4AkEoy2Sd",
                                                    "record": {
                                                        "fldp806ImQCDgR716": {
                                                            "id": "{{57.user.id}}",
                                                            "name": "{{57.user.name}}",
                                                            "email": "{{57.user.email}}"
                                                        },
                                                        "fldtsLD1ts8D9lfPB": "{{33.event.text}}"
                                                    },
                                                    "typecast": false,
                                                    "useColumnId": false
                                                },
                                                "metadata": {
                                                    "designer": {
                                                        "x": 1500,
                                                        "y": 1200,
                                                        "name": "Create Conversation History Record"
                                                    },
                                                    "restore": {
                                                        "expect": {
                                                            "base": {
                                                                "label": "Lucy"
                                                            },
                                                            "table": {
                                                                "label": "ConversationHistory",
                                                                "nested": [
                                                                    {
                                                                        "name": "record",
                                                                        "spec": [
                                                                            {
                                                                                "name": "fldp806ImQCDgR716",
                                                                                "spec": [
                                                                                    {
                                                                                        "help": "Unique user id",
                                                                                        "name": "id",
                                                                                        "type": "text",
                                                                                        "label": "ID"
                                                                                    },
                                                                                    {
                                                                                        "help": "User's email address",
                                                                                        "name": "email",
                                                                                        "type": "email",
                                                                                        "label": "Email"
                                                                                    },
                                                                                    {
                                                                                        "help": "User's display name (may be empty if the user hasn't created an account)",
                                                                                        "name": "name",
                                                                                        "type": "text",
                                                                                        "label": "Name"
                                                                                    }
                                                                                ],
                                                                                "type": "collection",
                                                                                "label": "author"
                                                                            },
                                                                            {
                                                                                "name": "fldtsLD1ts8D9lfPB",
                                                                                "type": "text",
                                                                                "label": "message",
                                                                                "multiline": true
                                                                            }
                                                                        ],
                                                                        "type": "collection",
                                                                        "label": "Record"
                                                                    }
                                                                ]
                                                            },
                                                            "typecast": {
                                                                "mode": "chose"
                                                            },
                                                            "useColumnId": {
                                                                "mode": "chose"
                                                            }
                                                        },
                                                        "parameters": {
                                                            "__IMTCONN__": {
                                                                "data": {
                                                                    "scoped": "true",
                                                                    "connection": "airtable3"
                                                                },
                                                                "label": "Make.com - Airtable (User ID: usr5oojEFDMW9OW2V)"
                                                            }
                                                        }
                                                    },
                                                    "parameters": [
                                                        {
                                                            "name": "__IMTCONN__",
                                                            "type": "account:airtable3,airtable2",
                                                            "label": "Connection",
                                                            "required": true
                                                        }
                                                    ],
                                                    "expect": [
                                                        {
                                                            "name": "base",
                                                            "type": "select",
                                                            "label": "Base",
                                                            "required": true
                                                        },
                                                        {
                                                            "name": "typecast",
                                                            "type": "boolean",
                                                            "label": "Smart links",
                                                            "required": true
                                                        },
                                                        {
                                                            "name": "useColumnId",
                                                            "type": "boolean",
                                                            "label": "Use Column ID",
                                                            "required": true
                                                        },
                                                        {
                                                            "name": "table",
                                                            "type": "select",
                                                            "label": "Table",
                                                            "required": true
                                                        },
                                                        {
                                                            "name": "record",
                                                            "spec": [
                                                                {
                                                                    "name": "fldp806ImQCDgR716",
                                                                    "spec": [
                                                                        {
                                                                            "name": "id",
                                                                            "type": "text",
                                                                            "label": "ID"
                                                                        },
                                                                        {
                                                                            "name": "email",
                                                                            "type": "email",
                                                                            "label": "Email"
                                                                        },
                                                                        {
                                                                            "name": "name",
                                                                            "type": "text",
                                                                            "label": "Name"
                                                                        }
                                                                    ],
                                                                    "type": "collection",
                                                                    "label": "author"
                                                                },
                                                                {
                                                                    "name": "fldtsLD1ts8D9lfPB",
                                                                    "type": "text",
                                                                    "label": "message"
                                                                }
                                                            ],
                                                            "type": "collection",
                                                            "label": "Record"
                                                        }
                                                    ],
                                                    "interface": [
                                                        {
                                                            "name": "id",
                                                            "type": "text",
                                                            "label": "ID"
                                                        },
                                                        {
                                                            "name": "createdTime",
                                                            "type": "date",
                                                            "label": "Created Time"
                                                        },
                                                        {
                                                            "name": "record_id",
                                                            "type": "text",
                                                            "label": "record_id"
                                                        },
                                                        {
                                                            "name": "author",
                                                            "spec": [
                                                                {
                                                                    "name": "id",
                                                                    "type": "text",
                                                                    "label": "ID"
                                                                },
                                                                {
                                                                    "name": "email",
                                                                    "type": "email",
                                                                    "label": "Email"
                                                                },
                                                                {
                                                                    "name": "name",
                                                                    "type": "text",
                                                                    "label": "Name"
                                                                }
                                                            ],
                                                            "type": "collection",
                                                            "label": "author"
                                                        },
                                                        {
                                                            "name": "message",
                                                            "type": "text",
                                                            "label": "message",
                                                            "multiline": true
                                                        },
                                                        {
                                                            "name": "created_time",
                                                            "type": "date",
                                                            "label": "created_time"
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                ]
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
    

Let’s break it down step by step.

1. **Custom Webhook -** Start with a simple webhook to listen for events. Make sure to register this URL in your Slack app settings.
2. **Webhook response -** there is filter on route checking that `event.type = url_verification`. This is to confirm and send back challange to slack. 
3. Next on router we check for `event.type = message`. Obviously we want to process only those events here. 
4. **Data store (Get a record)** - fetching user slack id here. For later use. 
5. **Router -** a few things here. Lets go one by one. 
    1. **Webhook response -** first send back webhook response. This to let slack know that we succeed in processing the event and to prevent resending this to us. I know that we don’t finish processing yet but that’s the mistake I can live with. I would rather prefer Lucy to not respond due to some error then responding multiple times and creating noise. 
    2. **If the message if from the user** - I’m just checking the author here. If its me → proceed. If the message comes from Lucy → Ignore. 
        1. First fetch not synced conversation history. Aggregate it in format like: 
            
            ```json
            kuba szwajka (2024-05-22T22:57:16.000Z): Hi! Whats my name? 
            Lucy AI assistant (2024-05-22T22:57:16.000Z): Hey there! I don't have your name yet. What's your name? :smile: 
            kuba szwajka (2024-05-22T22:57:26.000Z): my name is Kuba. Hi! 
            Lucy AI assistant (2024-05-22T22:57:28.000Z): Hey Kuba! How's it going? :smile: 
            ```
            
        2. Then embed query sent to slack calling `v1/embeddings` endpoint with **Make an API call.** Next based on the resulting vector I’m querying my pinecone database for similar vectors (Assuming it will return vectors with informations that might be related to my query).
        3. More on those vectors and their metadata later but here I’m just taking vector [`metadata.id`](http://metadata.id) and based on that fetching `memories` database by ids. 
        4. **GPT Completion -** here is the completion itself. The context at this place is build on two things. First - not synced conversation history that might contain useful facts. Second - useful memories that were found in pinecone. 
        5. **Create slack message** 
    3. In the end, no matter who created message, I’m saving it with the author to `ConversationHistory` database and mark `synced=false`.   
        
        

# Scenario - Lucy find memories in conversation

![Untitled](/blog-images/creating-lucy-developing-an-ai-powered-slack-assistant-with-memory/Untitled%25203.png)

- 📘 Blueprint
    
    ```json
    {
        "name": "Lucy - find memories in conversation and embed",
        "flow": [
            {
                "id": 1,
                "module": "airtable:ActionSearchRecords",
                "version": 3,
                "parameters": {
                    "__IMTCONN__": 2550376
                },
                "mapper": {
                    "base": "apptRld5563ZpjbTr",
                    "view": "viwXwzY7Ob2N2tcTe",
                    "table": "tblOci1y4AkEoy2Sd",
                    "fields": [
                        "record_id",
                        "author",
                        "message",
                        "created_time",
                        "synced"
                    ],
                    "maxRecords": "100",
                    "useColumnId": false
                },
                "metadata": {
                    "designer": {
                        "x": 0,
                        "y": 150
                    },
                    "restore": {
                        "expect": {
                            "base": {
                                "mode": "chose",
                                "label": "Lucy"
                            },
                            "sort": {
                                "mode": "chose"
                            },
                            "view": {
                                "mode": "chose",
                                "label": "Not synced"
                            },
                            "table": {
                                "mode": "chose",
                                "label": "ConversationHistory"
                            },
                            "fields": {
                                "mode": "chose",
                                "label": [
                                    "record_id",
                                    "author",
                                    "message",
                                    "created_time",
                                    "synced"
                                ]
                            },
                            "useColumnId": {
                                "mode": "chose"
                            }
                        },
                        "parameters": {
                            "__IMTCONN__": {
                                "data": {
                                    "scoped": "true",
                                    "connection": "airtable3"
                                },
                                "label": "Make.com - Airtable (User ID: usr5oojEFDMW9OW2V)"
                            }
                        }
                    },
                    "parameters": [
                        {
                            "name": "__IMTCONN__",
                            "type": "account:airtable3,airtable2",
                            "label": "Connection",
                            "required": true
                        }
                    ],
                    "expect": [
                        {
                            "name": "base",
                            "type": "select",
                            "label": "Base",
                            "required": true
                        },
                        {
                            "name": "useColumnId",
                            "type": "boolean",
                            "label": "Use Column ID",
                            "required": true
                        },
                        {
                            "name": "table",
                            "type": "select",
                            "label": "Table",
                            "required": true
                        },
                        {
                            "name": "formula",
                            "type": "text",
                            "label": "Formula"
                        },
                        {
                            "name": "maxRecords",
                            "type": "integer",
                            "label": "Limit"
                        },
                        {
                            "name": "sort",
                            "spec": [
                                {
                                    "name": "field",
                                    "type": "select",
                                    "label": "Field",
                                    "dynamic": true,
                                    "options": []
                                },
                                {
                                    "name": "direction",
                                    "type": "select",
                                    "label": "Direction",
                                    "options": [
                                        {
                                            "label": "Descending",
                                            "value": "desc"
                                        },
                                        {
                                            "label": "Ascending",
                                            "value": "asc"
                                        }
                                    ]
                                }
                            ],
                            "type": "array",
                            "label": "Sort"
                        },
                        {
                            "name": "view",
                            "type": "select",
                            "label": "View"
                        },
                        {
                            "name": "fields",
                            "type": "select",
                            "label": "Output Fields",
                            "multiple": true
                        }
                    ],
                    "interface": [
                        {
                            "name": "__IMTLENGTH__",
                            "type": "uinteger",
                            "label": "Total number of bundles"
                        },
                        {
                            "name": "__IMTINDEX__",
                            "type": "uinteger",
                            "label": "Bundle order position"
                        },
                        {
                            "name": "id",
                            "type": "text",
                            "label": "ID"
                        },
                        {
                            "name": "createdTime",
                            "type": "date",
                            "label": "Created Time"
                        },
                        {
                            "name": "record_id",
                            "type": "text",
                            "label": "record_id"
                        },
                        {
                            "name": "author",
                            "spec": [
                                {
                                    "name": "id",
                                    "type": "text",
                                    "label": "ID"
                                },
                                {
                                    "name": "email",
                                    "type": "email",
                                    "label": "Email"
                                },
                                {
                                    "name": "name",
                                    "type": "text",
                                    "label": "Name"
                                }
                            ],
                            "type": "collection",
                            "label": "author"
                        },
                        {
                            "name": "message",
                            "type": "text",
                            "label": "message",
                            "multiline": true
                        },
                        {
                            "name": "created_time",
                            "type": "date",
                            "label": "created_time"
                        },
                        {
                            "name": "synced",
                            "type": "boolean",
                            "label": "synced"
                        }
                    ]
                }
            },
            {
                "id": 3,
                "module": "builtin:BasicAggregator",
                "version": 1,
                "parameters": {
                    "feeder": 1
                },
                "mapper": {
                    "id": "{{1.id}}",
                    "author": "{{1.author}}",
                    "message": "{{1.message}}",
                    "created_time": "{{1.created_time}}"
                },
                "metadata": {
                    "designer": {
                        "x": 300,
                        "y": 150
                    },
                    "restore": {
                        "extra": {
                            "feeder": {
                                "label": "Airtable - Search Records [1]"
                            },
                            "target": {
                                "label": "Custom"
                            }
                        }
                    }
                }
            },
            {
                "id": 4,
                "module": "builtin:BasicFeeder",
                "version": 1,
                "parameters": {},
                "mapper": {
                    "array": "{{3.array}}"
                },
                "metadata": {
                    "designer": {
                        "x": 600,
                        "y": 150
                    },
                    "restore": {
                        "expect": {
                            "array": {
                                "mode": "edit"
                            }
                        }
                    },
                    "expect": [
                        {
                            "mode": "edit",
                            "name": "array",
                            "spec": [],
                            "type": "array",
                            "label": "Array",
                            "editable": true
                        }
                    ]
                }
            },
            {
                "id": 29,
                "module": "builtin:BasicRouter",
                "version": 1,
                "mapper": null,
                "metadata": {
                    "designer": {
                        "x": 900,
                        "y": 150
                    }
                },
                "routes": [
                    {
                        "flow": [
                            {
                                "id": 5,
                                "module": "util:TextAggregator",
                                "version": 1,
                                "parameters": {
                                    "feeder": 4,
                                    "rowSeparator": ""
                                },
                                "mapper": {
                                    "value": "- {{4.author.name}} ({{4.created_time}}): {{4.message}} {{newline}}"
                                },
                                "metadata": {
                                    "designer": {
                                        "x": 1200,
                                        "y": 0
                                    },
                                    "restore": {
                                        "extra": {
                                            "feeder": {
                                                "label": "Iterator [4]"
                                            }
                                        },
                                        "parameters": {
                                            "rowSeparator": {
                                                "label": "Empty"
                                            }
                                        }
                                    },
                                    "parameters": [
                                        {
                                            "name": "rowSeparator",
                                            "type": "select",
                                            "label": "Row separator",
                                            "validate": {
                                                "enum": [
                                                    "\n",
                                                    "\t",
                                                    "other"
                                                ]
                                            }
                                        }
                                    ],
                                    "expect": [
                                        {
                                            "name": "value",
                                            "type": "text",
                                            "label": "Text",
                                            "multiline": true
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 6,
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
                                            "content": "Your task is to extract and compile useful information from a series of messages in a conversation between a User and an AI assistant. This information should be distilled into a list, with each item representing a piece of useful information derived from the messages. The conversation is presented in chronological order, providing context for the information you're extracting.### Instructions:- **Output Format:** Your response must be formatted as a valid JSON object, specifically an array. Always ensure the output is a well-formed JSON object. - **Avoid Improper Formatting:** Ensure that your response strictly adheres to JSON format standards. Responses like `{ }` (empty curly brackets without a key-value pair) are not acceptable. Instead, use `{\"memories\":[]}` for cases with no useful information.- **Avoid Duplication:** Ensure that you do not include duplicate pieces of information in your context.- **Filter Noise:** Your primary goal is to distill only useful information from the messages. Exclude any elements that do not contribute valuable insights.- **Empty Responses:** If no useful information is present in the messages, your response should be an empty list within the `memories` key: `{\"memories\":[]}`.- **Exclude Questions:** Do not consider questions as containing useful information.- **Forgetting Information:** If instructed within the messages to forget certain information, ensure that it is not included in your list.- **Formatting:** Begin and end all responses with curly brackets `{}`, and ensure the presence of the `\"memories\"` key even when no data is present.\n\n\n\n\n### Examples:\n- **User Message:** \"My name is Kuba\"\n  - **AI Response:** `{\"memories\": [\"User's name is Kuba\"]}`\n\n- **User Message:** \"Nice to meet you, Kuba! How can I assist you today?\"\n  - **AI Response:** `{\"memories\":[]}`\n\n- **User Message:** \"I had a bad day\"\n  - **AI Response:** {\"memories\":[]}\n\n- **User Message:** \"The planet Earth is flat?\"\n  - **AI Response:** {\"memories\":[]}\n\n- **User Message:** \"The planet Earth is not flat!\"\n  - **AI Response:** {\"memories\":[\"Planet Earth is not flat\"]}\n\n- **User Message:** \"I have an appointment tomorrow with xyz\"\n  - **AI Response:** {\"memories\":[\"Appointment with xyz on {today's date + one day}\"]}\n\n- **User Message:** \"I have two cats\"\n  - **AI Response:** {\"memories\":[\"Kuba has two cats\"]}\n\n- **User Message:** \"I have two cats but please forget about it!\"\n  - **AI Response:** {\"memories\":[]}\n\n- **User Message:** \"Today is Friday\"\n  - **AI Response:** {\"memories\":[]}\n"
                                        },
                                        {
                                            "role": "user",
                                            "content": "{{5.text}}"
                                        }
                                    ],
                                    "max_tokens": "0",
                                    "temperature": "1",
                                    "n_completions": "1",
                                    "response_format": "json_object"
                                },
                                "metadata": {
                                    "designer": {
                                        "x": 1500,
                                        "y": 0
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
                                                "label": "JSON Object"
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
                                                "label": "Make.com - Open AI"
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
                                            "label": "Max Tokens",
                                            "required": true
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
                                    ],
                                    "advanced": true
                                }
                            },
                            {
                                "id": 7,
                                "module": "json:ParseJSON",
                                "version": 1,
                                "parameters": {
                                    "type": 166549
                                },
                                "mapper": {
                                    "json": "{{6.result}}"
                                },
                                "metadata": {
                                    "designer": {
                                        "x": 1800,
                                        "y": 0
                                    },
                                    "restore": {
                                        "parameters": {
                                            "type": {
                                                "label": "Lucy - memories"
                                            }
                                        }
                                    },
                                    "parameters": [
                                        {
                                            "name": "type",
                                            "type": "udt",
                                            "label": "Data structure"
                                        }
                                    ],
                                    "expect": [
                                        {
                                            "name": "json",
                                            "type": "text",
                                            "label": "JSON string",
                                            "required": true
                                        }
                                    ],
                                    "interface": [
                                        {
                                            "name": "memories",
                                            "spec": {
                                                "name": "value",
                                                "type": "text",
                                                "label": "Value",
                                                "default": null,
                                                "required": false,
                                                "multiline": false
                                            },
                                            "type": "array",
                                            "label": "Memories",
                                            "required": false
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 8,
                                "module": "builtin:BasicFeeder",
                                "version": 1,
                                "parameters": {},
                                "filter": {
                                    "name": "if any informations to save",
                                    "conditions": [
                                        [
                                            {
                                                "a": "{{7.memories}}",
                                                "b": "0",
                                                "o": "array:greater"
                                            }
                                        ]
                                    ]
                                },
                                "mapper": {
                                    "array": "{{7.memories}}"
                                },
                                "metadata": {
                                    "designer": {
                                        "x": 2100,
                                        "y": 0
                                    },
                                    "restore": {
                                        "expect": {
                                            "array": {
                                                "mode": "edit"
                                            }
                                        }
                                    },
                                    "expect": [
                                        {
                                            "mode": "edit",
                                            "name": "array",
                                            "spec": [],
                                            "type": "array",
                                            "label": "Array",
                                            "editable": true
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 9,
                                "module": "airtable:ActionCreateRecord",
                                "version": 3,
                                "parameters": {
                                    "__IMTCONN__": 2550376
                                },
                                "mapper": {
                                    "base": "apptRld5563ZpjbTr",
                                    "table": "tblayy4f4EHXxAEAw",
                                    "record": {
                                        "fld8bNU3kgfqKj765": "SLACK_CONVERSATION",
                                        "fldKKHK4dYJMHmdbW": "memory",
                                        "fldYn0WjgvfpQ56Xi": false,
                                        "fldaySKYOHuQ62DpM": "{{now}}",
                                        "fldrDGEjhq2buozbq": "{{8.value}}"
                                    },
                                    "typecast": false,
                                    "useColumnId": false
                                },
                                "metadata": {
                                    "designer": {
                                        "x": 2400,
                                        "y": 0
                                    },
                                    "restore": {
                                        "expect": {
                                            "base": {
                                                "label": "Lucy"
                                            },
                                            "table": {
                                                "label": "Memories",
                                                "nested": [
                                                    {
                                                        "name": "record",
                                                        "spec": [
                                                            {
                                                                "name": "fldmPgYnLKwItQGri",
                                                                "type": "text",
                                                                "label": "record_id",
                                                                "multiline": true
                                                            },
                                                            {
                                                                "name": "fldrDGEjhq2buozbq",
                                                                "type": "text",
                                                                "label": "content",
                                                                "multiline": true
                                                            },
                                                            {
                                                                "mode": "edit",
                                                                "name": "fldKKHK4dYJMHmdbW",
                                                                "type": "select",
                                                                "label": "type",
                                                                "dynamic": true,
                                                                "options": [
                                                                    {
                                                                        "label": "resource",
                                                                        "value": "resource"
                                                                    },
                                                                    {
                                                                        "label": "memory",
                                                                        "value": "memory"
                                                                    },
                                                                    {
                                                                        "label": "note",
                                                                        "value": "note"
                                                                    },
                                                                    {
                                                                        "label": "skill",
                                                                        "value": "skill"
                                                                    }
                                                                ],
                                                                "validate": false
                                                            },
                                                            {
                                                                "name": "fld8bNU3kgfqKj765",
                                                                "type": "text",
                                                                "label": "source"
                                                            },
                                                            {
                                                                "name": "fldaySKYOHuQ62DpM",
                                                                "time": true,
                                                                "type": "date",
                                                                "label": "created_at"
                                                            },
                                                            {
                                                                "name": "fldYn0WjgvfpQ56Xi",
                                                                "type": "boolean",
                                                                "label": "synced"
                                                            },
                                                            {
                                                                "name": "fldDiOvsBD6skQsS7",
                                                                "type": "text",
                                                                "label": "update"
                                                            }
                                                        ],
                                                        "type": "collection",
                                                        "label": "Record"
                                                    }
                                                ]
                                            },
                                            "record": {
                                                "nested": {
                                                    "fldKKHK4dYJMHmdbW": {
                                                        "mode": "chose",
                                                        "label": "memory"
                                                    },
                                                    "fldYn0WjgvfpQ56Xi": {
                                                        "mode": "chose"
                                                    }
                                                }
                                            },
                                            "typecast": {
                                                "mode": "chose"
                                            },
                                            "useColumnId": {
                                                "mode": "chose"
                                            }
                                        },
                                        "parameters": {
                                            "__IMTCONN__": {
                                                "data": {
                                                    "scoped": "true",
                                                    "connection": "airtable3"
                                                },
                                                "label": "Make.com - Airtable (User ID: usr5oojEFDMW9OW2V)"
                                            }
                                        }
                                    },
                                    "parameters": [
                                        {
                                            "name": "__IMTCONN__",
                                            "type": "account:airtable3,airtable2",
                                            "label": "Connection",
                                            "required": true
                                        }
                                    ],
                                    "expect": [
                                        {
                                            "name": "base",
                                            "type": "select",
                                            "label": "Base",
                                            "required": true
                                        },
                                        {
                                            "name": "typecast",
                                            "type": "boolean",
                                            "label": "Smart links",
                                            "required": true
                                        },
                                        {
                                            "name": "useColumnId",
                                            "type": "boolean",
                                            "label": "Use Column ID",
                                            "required": true
                                        },
                                        {
                                            "name": "table",
                                            "type": "select",
                                            "label": "Table",
                                            "required": true
                                        },
                                        {
                                            "name": "record",
                                            "spec": [
                                                {
                                                    "name": "fldmPgYnLKwItQGri",
                                                    "type": "text",
                                                    "label": "record_id"
                                                },
                                                {
                                                    "name": "fldrDGEjhq2buozbq",
                                                    "type": "text",
                                                    "label": "content"
                                                },
                                                {
                                                    "mode": "edit",
                                                    "name": "fldKKHK4dYJMHmdbW",
                                                    "type": "select",
                                                    "label": "type"
                                                },
                                                {
                                                    "name": "fld8bNU3kgfqKj765",
                                                    "type": "text",
                                                    "label": "source"
                                                },
                                                {
                                                    "name": "fldaySKYOHuQ62DpM",
                                                    "time": true,
                                                    "type": "date",
                                                    "label": "created_at"
                                                },
                                                {
                                                    "name": "fldYn0WjgvfpQ56Xi",
                                                    "type": "boolean",
                                                    "label": "synced"
                                                },
                                                {
                                                    "name": "fldDiOvsBD6skQsS7",
                                                    "type": "text",
                                                    "label": "update"
                                                }
                                            ],
                                            "type": "collection",
                                            "label": "Record"
                                        }
                                    ],
                                    "interface": [
                                        {
                                            "name": "id",
                                            "type": "text",
                                            "label": "ID"
                                        },
                                        {
                                            "name": "createdTime",
                                            "type": "date",
                                            "label": "Created Time"
                                        },
                                        {
                                            "name": "record_id",
                                            "type": "text",
                                            "label": "record_id",
                                            "multiline": true
                                        },
                                        {
                                            "name": "content",
                                            "type": "text",
                                            "label": "content",
                                            "multiline": true
                                        },
                                        {
                                            "name": "type",
                                            "type": "text",
                                            "label": "type"
                                        },
                                        {
                                            "name": "source",
                                            "type": "text",
                                            "label": "source"
                                        },
                                        {
                                            "name": "created_at",
                                            "time": true,
                                            "type": "date",
                                            "label": "created_at"
                                        },
                                        {
                                            "name": "synced",
                                            "type": "boolean",
                                            "label": "synced"
                                        },
                                        {
                                            "name": "update",
                                            "type": "text",
                                            "label": "update"
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 25,
                                "module": "json:CreateJSON",
                                "version": 1,
                                "parameters": {
                                    "type": 165928,
                                    "space": ""
                                },
                                "mapper": {
                                    "input": "{{8.value}}",
                                    "model": "text-embedding-ada-002"
                                },
                                "metadata": {
                                    "designer": {
                                        "x": 2700,
                                        "y": 0,
                                        "name": "Embedding JSON"
                                    },
                                    "restore": {
                                        "parameters": {
                                            "type": {
                                                "label": "Embedding"
                                            },
                                            "space": {
                                                "label": "Empty"
                                            }
                                        }
                                    },
                                    "parameters": [
                                        {
                                            "name": "type",
                                            "type": "udt",
                                            "label": "Data structure",
                                            "required": true
                                        },
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
                                            "name": "input",
                                            "type": "text",
                                            "label": "Input"
                                        },
                                        {
                                            "name": "model",
                                            "type": "text",
                                            "label": "Model"
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 26,
                                "module": "openai-gpt-3:makeApiCall",
                                "version": 1,
                                "parameters": {
                                    "__IMTCONN__": 2545095
                                },
                                "mapper": {
                                    "url": "/v1/embeddings",
                                    "body": "{{25.json}}",
                                    "method": "POST",
                                    "headers": [
                                        {
                                            "key": "Content-Type",
                                            "value": "application/json"
                                        }
                                    ]
                                },
                                "metadata": {
                                    "designer": {
                                        "x": 3000,
                                        "y": 0
                                    },
                                    "restore": {
                                        "expect": {
                                            "qs": {
                                                "mode": "chose"
                                            },
                                            "method": {
                                                "mode": "chose",
                                                "label": "POST"
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
                                                    "connection": "openai-gpt-3"
                                                },
                                                "label": "Make.com - Open AI"
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
                                            "spec": {
                                                "name": "value",
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
                                                "type": "collection",
                                                "label": "Header"
                                            },
                                            "type": "array",
                                            "label": "Headers"
                                        },
                                        {
                                            "name": "qs",
                                            "spec": {
                                                "name": "value",
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
                                                "type": "collection",
                                                "label": "Query String"
                                            },
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
                                "id": 27,
                                "module": "pinecone:upsertVector",
                                "version": 1,
                                "parameters": {
                                    "__IMTCONN__": 2619315
                                },
                                "mapper": {
                                    "id": "{{9.id}}",
                                    "values": "{{26.body.data[].embedding}}",
                                    "metadata": [
                                        {
                                            "fieldName": "type",
                                            "fieldType": "string",
                                            "fieldValue": "{{9.type}}"
                                        },
                                        {
                                            "fieldName": "source",
                                            "fieldType": "string",
                                            "fieldValue": "{{9.source}}"
                                        },
                                        {
                                            "fieldName": "id",
                                            "fieldType": "string",
                                            "fieldValue": "{{9.record_id}}"
                                        },
                                        {
                                            "fieldName": "created_at",
                                            "fieldType": "string",
                                            "fieldValue": "{{9.created_at}}"
                                        }
                                    ],
                                    "namespace": "memories",
                                    "sparseVector": {}
                                },
                                "metadata": {
                                    "designer": {
                                        "x": 3300,
                                        "y": 0
                                    },
                                    "restore": {
                                        "expect": {
                                            "values": {
                                                "mode": "edit"
                                            },
                                            "metadata": {
                                                "mode": "chose",
                                                "items": [
                                                    {
                                                        "fieldType": {
                                                            "mode": "chose",
                                                            "label": "String"
                                                        }
                                                    },
                                                    {
                                                        "fieldType": {
                                                            "mode": "chose",
                                                            "label": "String"
                                                        }
                                                    },
                                                    {
                                                        "fieldType": {
                                                            "mode": "chose",
                                                            "label": "String"
                                                        }
                                                    },
                                                    {
                                                        "fieldType": {
                                                            "mode": "chose",
                                                            "label": "String"
                                                        }
                                                    }
                                                ]
                                            },
                                            "sparseVector": {
                                                "nested": {
                                                    "values": {
                                                        "mode": "chose"
                                                    },
                                                    "indices": {
                                                        "mode": "chose"
                                                    }
                                                }
                                            }
                                        },
                                        "parameters": {
                                            "__IMTCONN__": {
                                                "data": {
                                                    "scoped": "true",
                                                    "connection": "pinecone"
                                                },
                                                "label": "My Pinecone connection"
                                            }
                                        }
                                    },
                                    "parameters": [
                                        {
                                            "name": "__IMTCONN__",
                                            "type": "account:pinecone",
                                            "label": "Connection",
                                            "required": true
                                        }
                                    ],
                                    "expect": [
                                        {
                                            "name": "id",
                                            "type": "text",
                                            "label": "Vector ID",
                                            "required": true
                                        },
                                        {
                                            "name": "values",
                                            "spec": {
                                                "name": "value",
                                                "type": "number",
                                                "label": "Value"
                                            },
                                            "type": "array",
                                            "label": "Values",
                                            "required": true
                                        },
                                        {
                                            "name": "sparseVector",
                                            "spec": [
                                                {
                                                    "name": "indices",
                                                    "spec": {
                                                        "name": "value",
                                                        "type": "integer",
                                                        "label": "Index"
                                                    },
                                                    "type": "array",
                                                    "label": "Indices"
                                                },
                                                {
                                                    "name": "values",
                                                    "spec": {
                                                        "name": "value",
                                                        "type": "number",
                                                        "label": "Value"
                                                    },
                                                    "type": "array",
                                                    "label": "Values"
                                                }
                                            ],
                                            "type": "collection",
                                            "label": "Sparse Vector"
                                        },
                                        {
                                            "name": "metadata",
                                            "spec": [
                                                {
                                                    "name": "fieldName",
                                                    "type": "text",
                                                    "label": "Key",
                                                    "required": true
                                                },
                                                {
                                                    "name": "fieldType",
                                                    "type": "select",
                                                    "label": "Type",
                                                    "options": [
                                                        {
                                                            "label": "String",
                                                            "value": "string",
                                                            "nested": [
                                                                {
                                                                    "name": "fieldValue",
                                                                    "type": "text",
                                                                    "label": "Value",
                                                                    "required": true
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "label": "Number",
                                                            "value": "number",
                                                            "nested": [
                                                                {
                                                                    "name": "fieldValue",
                                                                    "type": "number",
                                                                    "label": "Value",
                                                                    "required": true
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "label": "Boolean",
                                                            "value": "boolean",
                                                            "nested": [
                                                                {
                                                                    "name": "fieldValue",
                                                                    "type": "boolean",
                                                                    "label": "Value",
                                                                    "required": true
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "label": "List",
                                                            "value": "list",
                                                            "nested": [
                                                                {
                                                                    "name": "fieldValue",
                                                                    "spec": {
                                                                        "type": "text",
                                                                        "label": "Value"
                                                                    },
                                                                    "type": "array",
                                                                    "label": "Value",
                                                                    "required": true
                                                                }
                                                            ]
                                                        }
                                                    ],
                                                    "required": true
                                                }
                                            ],
                                            "type": "array",
                                            "label": "Metadata"
                                        },
                                        {
                                            "name": "namespace",
                                            "type": "text",
                                            "label": "Namespace"
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 28,
                                "module": "airtable:ActionUpdateRecords",
                                "version": 3,
                                "parameters": {
                                    "__IMTCONN__": 2550376
                                },
                                "mapper": {
                                    "id": "{{9.id}}",
                                    "base": "apptRld5563ZpjbTr",
                                    "table": "tblayy4f4EHXxAEAw",
                                    "record": {
                                        "fld8bNU3kgfqKj765": "{{9.source}}",
                                        "fldKKHK4dYJMHmdbW": "{{9.type}}",
                                        "fldYn0WjgvfpQ56Xi": true,
                                        "fldaySKYOHuQ62DpM": "{{9.created_at}}",
                                        "fldrDGEjhq2buozbq": "{{9.content}}"
                                    },
                                    "typecast": false,
                                    "useColumnId": false
                                },
                                "metadata": {
                                    "designer": {
                                        "x": 3600,
                                        "y": 0
                                    },
                                    "restore": {
                                        "expect": {
                                            "base": {
                                                "label": "Lucy"
                                            },
                                            "table": {
                                                "label": "Memories"
                                            },
                                            "record": {
                                                "nested": {
                                                    "fldKKHK4dYJMHmdbW": {
                                                        "mode": "edit"
                                                    },
                                                    "fldYn0WjgvfpQ56Xi": {
                                                        "mode": "chose"
                                                    }
                                                }
                                            },
                                            "typecast": {
                                                "mode": "chose"
                                            },
                                            "useColumnId": {
                                                "mode": "chose"
                                            }
                                        },
                                        "parameters": {
                                            "__IMTCONN__": {
                                                "data": {
                                                    "scoped": "true",
                                                    "connection": "airtable3"
                                                },
                                                "label": "Make.com - Airtable (User ID: usr5oojEFDMW9OW2V)"
                                            }
                                        }
                                    },
                                    "parameters": [
                                        {
                                            "name": "__IMTCONN__",
                                            "type": "account:airtable3,airtable2",
                                            "label": "Connection",
                                            "required": true
                                        }
                                    ],
                                    "expect": [
                                        {
                                            "name": "base",
                                            "type": "select",
                                            "label": "Base",
                                            "required": true
                                        },
                                        {
                                            "name": "typecast",
                                            "type": "boolean",
                                            "label": "Smart links",
                                            "required": true
                                        },
                                        {
                                            "name": "useColumnId",
                                            "type": "boolean",
                                            "label": "Use Column ID",
                                            "required": true
                                        },
                                        {
                                            "name": "table",
                                            "type": "select",
                                            "label": "Table",
                                            "required": true
                                        },
                                        {
                                            "name": "id",
                                            "type": "text",
                                            "label": "Record ID",
                                            "required": true
                                        },
                                        {
                                            "name": "record",
                                            "spec": [
                                                {
                                                    "name": "fldrDGEjhq2buozbq",
                                                    "type": "text",
                                                    "label": "content"
                                                },
                                                {
                                                    "mode": "edit",
                                                    "name": "fldKKHK4dYJMHmdbW",
                                                    "type": "select",
                                                    "label": "type"
                                                },
                                                {
                                                    "name": "fld8bNU3kgfqKj765",
                                                    "type": "text",
                                                    "label": "source"
                                                },
                                                {
                                                    "name": "fldaySKYOHuQ62DpM",
                                                    "time": true,
                                                    "type": "date",
                                                    "label": "created_at"
                                                },
                                                {
                                                    "name": "fldYn0WjgvfpQ56Xi",
                                                    "type": "boolean",
                                                    "label": "synced"
                                                },
                                                {
                                                    "name": "fldDiOvsBD6skQsS7",
                                                    "type": "text",
                                                    "label": "update"
                                                }
                                            ],
                                            "type": "collection",
                                            "label": "Record"
                                        }
                                    ],
                                    "interface": [
                                        {
                                            "name": "id",
                                            "type": "text",
                                            "label": "ID"
                                        },
                                        {
                                            "name": "createdTime",
                                            "type": "date",
                                            "label": "Created Time"
                                        },
                                        {
                                            "name": "record_id",
                                            "type": "text",
                                            "label": "record_id"
                                        },
                                        {
                                            "name": "content",
                                            "type": "text",
                                            "label": "content",
                                            "multiline": true
                                        },
                                        {
                                            "name": "type",
                                            "type": "text",
                                            "label": "type"
                                        },
                                        {
                                            "name": "source",
                                            "type": "text",
                                            "label": "source"
                                        },
                                        {
                                            "name": "created_at",
                                            "time": true,
                                            "type": "date",
                                            "label": "created_at"
                                        },
                                        {
                                            "name": "synced",
                                            "type": "boolean",
                                            "label": "synced"
                                        },
                                        {
                                            "name": "update",
                                            "type": "text",
                                            "label": "update"
                                        }
                                    ]
                                }
                            }
                        ]
                    },
                    {
                        "flow": [
                            {
                                "id": 15,
                                "module": "airtable:ActionUpdateRecords",
                                "version": 3,
                                "parameters": {
                                    "__IMTCONN__": 2550376
                                },
                                "mapper": {
                                    "id": "{{4.id}}",
                                    "base": "apptRld5563ZpjbTr",
                                    "table": "tblOci1y4AkEoy2Sd",
                                    "record": {
                                        "fldlYCo5BaaDMysI7": true,
                                        "fldp806ImQCDgR716": {
                                            "id": "{{4.author.id}}",
                                            "name": "{{4.author.name}}",
                                            "email": "{{4.author.email}}"
                                        },
                                        "fldtsLD1ts8D9lfPB": "{{4.message}}"
                                    },
                                    "typecast": false,
                                    "useColumnId": false
                                },
                                "metadata": {
                                    "designer": {
                                        "x": 1200,
                                        "y": 300
                                    },
                                    "restore": {
                                        "expect": {
                                            "base": {
                                                "label": "Lucy"
                                            },
                                            "table": {
                                                "label": "ConversationHistory"
                                            },
                                            "record": {
                                                "nested": {
                                                    "fldlYCo5BaaDMysI7": {
                                                        "mode": "chose"
                                                    }
                                                }
                                            },
                                            "typecast": {
                                                "mode": "chose"
                                            },
                                            "useColumnId": {
                                                "mode": "chose"
                                            }
                                        },
                                        "parameters": {
                                            "__IMTCONN__": {
                                                "data": {
                                                    "scoped": "true",
                                                    "connection": "airtable3"
                                                },
                                                "label": "Make.com - Airtable (User ID: usr5oojEFDMW9OW2V)"
                                            }
                                        }
                                    },
                                    "parameters": [
                                        {
                                            "name": "__IMTCONN__",
                                            "type": "account:airtable3,airtable2",
                                            "label": "Connection",
                                            "required": true
                                        }
                                    ],
                                    "expect": [
                                        {
                                            "name": "base",
                                            "type": "select",
                                            "label": "Base",
                                            "required": true
                                        },
                                        {
                                            "name": "typecast",
                                            "type": "boolean",
                                            "label": "Smart links",
                                            "required": true
                                        },
                                        {
                                            "name": "useColumnId",
                                            "type": "boolean",
                                            "label": "Use Column ID",
                                            "required": true
                                        },
                                        {
                                            "name": "table",
                                            "type": "select",
                                            "label": "Table",
                                            "required": true
                                        },
                                        {
                                            "name": "id",
                                            "type": "text",
                                            "label": "Record ID",
                                            "required": true
                                        },
                                        {
                                            "name": "record",
                                            "spec": [
                                                {
                                                    "name": "fldp806ImQCDgR716",
                                                    "spec": [
                                                        {
                                                            "name": "id",
                                                            "type": "text",
                                                            "label": "ID"
                                                        },
                                                        {
                                                            "name": "email",
                                                            "type": "email",
                                                            "label": "Email"
                                                        },
                                                        {
                                                            "name": "name",
                                                            "type": "text",
                                                            "label": "Name"
                                                        }
                                                    ],
                                                    "type": "collection",
                                                    "label": "author"
                                                },
                                                {
                                                    "name": "fldtsLD1ts8D9lfPB",
                                                    "type": "text",
                                                    "label": "message"
                                                },
                                                {
                                                    "name": "fldlYCo5BaaDMysI7",
                                                    "type": "boolean",
                                                    "label": "synced"
                                                }
                                            ],
                                            "type": "collection",
                                            "label": "Record"
                                        }
                                    ],
                                    "interface": [
                                        {
                                            "name": "id",
                                            "type": "text",
                                            "label": "ID"
                                        },
                                        {
                                            "name": "createdTime",
                                            "type": "date",
                                            "label": "Created Time"
                                        },
                                        {
                                            "name": "record_id",
                                            "type": "text",
                                            "label": "record_id"
                                        },
                                        {
                                            "name": "author",
                                            "spec": [
                                                {
                                                    "name": "id",
                                                    "type": "text",
                                                    "label": "ID"
                                                },
                                                {
                                                    "name": "email",
                                                    "type": "email",
                                                    "label": "Email"
                                                },
                                                {
                                                    "name": "name",
                                                    "type": "text",
                                                    "label": "Name"
                                                }
                                            ],
                                            "type": "collection",
                                            "label": "author"
                                        },
                                        {
                                            "name": "message",
                                            "type": "text",
                                            "label": "message",
                                            "multiline": true
                                        },
                                        {
                                            "name": "created_time",
                                            "type": "date",
                                            "label": "created_time"
                                        },
                                        {
                                            "name": "synced",
                                            "type": "boolean",
                                            "label": "synced"
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
            "instant": false,
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
    

This scenario aims to process previously created conversation history, create memories and save them as a vectors. Right now it is triggered every 8 hours. Tbh. I’m testing if this is enough 🤷.

Nothing fancy here. Lets go step by step:

1. Fetch all records from `ConversationHistory` where `synced=false`.
2. Aggregate them as a text. 
3. Let Chat distill the facts (facts overlapping to be implemented? Not sure if this will be the problem 🤔? Any thoughts? )
4. For the list of facts/memories, create a records in `memories` table with `synced=false`. 
5. For each of these, create embedding calling `v1/embeddings` in OpenAI api. 
6. Save it to pinecone and mark as synced. 

# Action

- There are still a few missing pieces, like handling memory overlapping and preventing data loss during the conversation history to memory conversion.
- I’ve put some blueprints if you want to try it out.