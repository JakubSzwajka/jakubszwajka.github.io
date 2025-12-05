---
title: 'Streamline Your Log Monitoring with Tail Gazer: A One-Stop Solution for Tailing Multiple Service Logs'
description: '## Introduction'
pubDate: 'April 30, 2023'
tags: ['Random', 'Side Projects']
---

## **Introduction**

As developers, we often find ourselves juggling multiple terminal sessions to monitor logs from various services in our projects. This can become cumbersome and inefficient, especially when working with complex applications that include frontend, backend, and other services. Inspired by the convenience of Docker Compose's log stream, I sought to create a tool that would consolidate log monitoring into a single, user-friendly interface: Tail Gazer.

## **The Problem: Scattered Log Monitoring**

In a typical project setup, you might have separate terminal sessions for your frontend, backend, and other services. This scattered approach makes it difficult to keep track of logs, identify issues, and maintain a consistent workflow. Furthermore, switching between terminal sessions can be time-consuming and frustrating, particularly when troubleshooting problems.

## **The Solution: Tail Gazer - A Unified Log Monitoring Tool**

Tail Gazer is a command-line tool that consolidates logs from multiple services, providing a single point of access for monitoring your project's log output. With an easy-to-use JSON configuration file, you can define your services, their working directories, and the commands used to start them. Tail Gazer then presents the logs in a color-coded, readable format, making it simple to track the activity of each service.

## **How Tail Gazer Works: Streamlined Log Monitoring**

To start using Tail Gazer, follow these steps:

1. Install the package globally with npm:

```
npm install -g tail-gazer
```

1. Create a configuration file named **`tail-gazer.json`** in your project directory. This file should include an array of service objects, each with the following properties:
    - name: The name of the service
    - dir: The working directory for the service
    - command: The command to start the service
    - logFile (optional): The file path to log service output to

Here's an example configuration for a project with frontend and backend services:

```
{
  "services": [
    {
      "name": "Frontend Service",
      "dir": "./frontend",
      "command": "npm run dev",
      "logFile": "./logs/frontend.log"
    },
    {
      "name": "Backend Service",
      "dir": "./backend",
      "command": "python app.py"
    }
  ]
}
```

1. Run Tail Gazer in the directory containing your configuration file:

```
tail-gazer
```

You can also specify a custom configuration file with the **`--config`** or **`-c`** option:

```
tail-gazer --config my-tail-gazer-config.json
```

Tail Gazer will display the logs of all specified services in a single console output, using distinct colors for each service to improve readability. If the **`logFile`** property is provided, Tail Gazer will also create a **`tail-gazer-logs`** directory in the current directory and save log files there.

## **Additional Benefits of Tail Gazer**

Tail Gazer not only simplifies log monitoring but also offers several other advantages:

- Saves time by eliminating the need to switch between multiple terminal sessions
- Facilitates troubleshooting by providing a consistent log stream across all services

## **Take Action: Try Tail Gazer Today**

Ready to streamline your log monitoring? Give Tail Gazer a try! Visit the [**GitHub repository**](https://github.com/JakubSzwajka/tail-gazer) and [**npm package**](https://www.npmjs.com/package/tail-gazer) for more information. If you have questions, suggestions, or would like to contribute