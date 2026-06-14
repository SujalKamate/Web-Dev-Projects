# System Design Visualizer

An interactive client-side design and simulation tool to learn system architecture. It features a drag-and-drop canvas, preset interview architectures, live traffic load simulators with latency/error tracking, and interactive optimization challenges.

## Features

- **Interactive Architecture Canvas**: Drag-and-drop or select components (Client, DNS, Load Balancer, App Server, Cache, Database, Message Queue, CDN) onto a snapping-grid canvas.
- **Draw Connections**: Easily create connection flows between components to route traffic.
- **Real-Time Traffic Simulator**: Click "Simulate Load" to trigger visual traffic request particles traversing paths, simulating server throughput and loads.
- **Metrics Dashboard**: Track live performance values including QPS throughput, Average Latency (ms), Error Rate (%), and Cache Hit Rate (%).
- **Failures & Fault Tolerance**: Click components to toggle "Offline/Online" states and watch how the system handles load shedding, fallback routing, and service degradation.
- **Preset System Templates**: Learn common system design interviews architectures:
  - **TinyURL**: Tiny shortener using App Servers, Redis Caches, and SQL DBs.
  - **Netflix Streaming**: Heavy asset delivery using CDNs, API Gateways, Microservices, and Object Storages.
  - **WhatsApp Chat**: Low-latency message processing using Websocket Gateways, Message Queues, and NoSQL DBs.
- **Badge Challenges**: Test your design optimization skills:
  - *Cache Wizard*: Add a cache in front of a DB to reduce average latency below 15ms.
  - *Traffic controller*: Distribute 10k QPS across servers with a Load Balancer to prevent node overloading.
  - *Reliability Expert*: Add redundant paths or components to drop error rates to 0%.

## Run it

Open `index.html` in any modern browser.

## What it shows

- Client-side drag-and-drop node placement engine on canvas.
- Real-time routing graph parsing and visual CSS animation overlays.
- Adaptive performance algorithms calculating latencies and hit ratios.
- Local storage syncing of custom architectures and lab progress.
- Accessible layouts with modern grid styling.
