# NET-SPROUT // Packet Routing Simulator

An interactive browser-based educational platform for modeling dynamic network topologies, autonomous packet transmissions, and path-finding optimization matrices. Built with a premium light botanical UI theme, this platform transforms abstract computer networking concepts into real-time interactive node graphs and animated packet flows.

---

## Network Topologies and Packet Switching Foundations

In modern computer networks, **packet switching** enables data to be fragmented into discrete packets, each routed independently from source to destination across shared infrastructure. The path each packet takes is determined by **routing protocols** that maintain topological maps and compute optimal pathways.

Network topology defines the physical or logical arrangement of nodes (routers, hosts) and the links connecting them. Common topologies include **star**, **mesh**, and **ring** configurations, each with distinct performance and redundancy characteristics.

### Key Performance Metrics

The efficiency of a routing strategy is evaluated by its ability to minimize end-to-end delay:

$$C_{path} = \sum_{e \in \text{Path}} \left( \text{Metric Cost}(e) + \frac{\text{Current Traffic}(e)}{\text{Bandwidth Capacity}(e)} \right)$$

Total network transit delay comprises four components:

$$D_{total} = D_{proc} + D_{queue} + D_{trans} + D_{prop}$$

Where transmission and propagation delays are computed as:

$$D_{trans} = \frac{L}{R} \quad \text{and} \quad D_{prop} = \frac{d}{v}$$

- $L$ = Packet size (bits)
- $R$ = Link bandwidth (bps)
- $d$ = Link distance (meters)
- $v$ = Signal propagation speed ($2 \times 10^8$ m/s in copper)

---

## Comparative Analysis of Routing Paradigms

### Link-State (Dijkstra) — Shortest Path First

Dijkstra's algorithm computes the shortest path from a source node to all destinations using a weighted graph where each link carries a **metric cost** (typically based on bandwidth, delay, or administrative weight). The algorithm maintains a set of unvisited nodes, iteratively selecting the node with the smallest known distance, relaxing its neighbors, and repeating until all destinations are reached.

**Properties:** Produces the globally optimal path for the given static metric; converges quickly in stable topologies; requires complete topology knowledge at each router.

### Hop-Count Minimization

Also known as the shortest-path in terms of node transitions, this algorithm uses **Breadth-First Search (BFS)** over the unweighted graph to find the path with the fewest intermediate nodes. Link bandwidth and propagation delays are ignored entirely.

**Properties:** Minimizes the number of store-and-forward operations; simple to compute; may select paths with poor throughput if low-bandwidth links are involved.

### Dynamic Traffic-Aware Routing

A variant of Dijkstra where link costs are dynamically adjusted based on real-time queue occupancy and congestion levels. Links approaching saturation receive inflated cost values, steering new flows away from bottlenecks.

**Properties:** Adapts to changing traffic patterns; improves overall network utilization; can oscillate if not carefully dampened; requires continuous path recomputation.

---

## Graph Data Structures and Pathfinding Topologies

The simulator maintains a **single-source-of-truth graph state** tracking:

- **Node objects** with identifier, type (Router/Host), and canvas coordinates
- **Link objects** with source/destination endpoints, bandwidth capacity, physical length, and dynamic packet queue
- **Packet objects** with source, destination, computed path sequence, current position interpolation state, accumulated delay, and delivery status

### Routing Algorithm Pipeline

1. **Topology Discovery** — Node and link data structures are built from the active configuration.
2. **Adjacency Construction** — An adjacency list is generated from the link set, with edge weights varying by algorithm:
   - *Dijkstra:* `1 + length / 1000`
   - *Hop-Count:* Uniform weight of 1 (BFS)
   - *Traffic-Aware:* `1 + length / 1000 + queueLoad * 5`
3. **Path Computation** — The selected algorithm runs against the weighted adjacency list, returning an ordered array of node IDs.
4. **Packet Injection** — New packets are created with the computed path, positioned at the source node, and added to each traversed link's queue.
5. **Animation Loop** — A `requestAnimationFrame` loop advances packet positions along link slopes, handles queue congestion, and triggers delivery or drop events.

### Queuing and Congestion Model

Links maintain a queue of in-transit packets. When the queue length exceeds a threshold proportional to the link bandwidth, excess packets are flagged as **Dropped** due to buffer overflow. The congestion index metric reflects the proportion of links with elevated queue occupancy.

---

## Interface User Operations

1. **Select Routing Protocol** — Choose Dijkstra, Hop-Count, or Traffic-Aware via the tabbed selector.
2. **Build Topology** — Add nodes (Routers or Hosts) and links (with bandwidth and length) using the topology console. Drag nodes on the canvas to rearrange layout.
3. **Load Presets** — Quick-load pre-built topologies: Star, Mesh Core, or Bottleneck Loop.
4. **Initialize Network** — Validate and activate the current topology, computing routing tables.
5. **Inject Packets** — Configure source/destination, packet size (64-1500 bytes), and burst count, then dispatch.
6. **Observe Animation** — Watch packets travel along computed paths, with live telemetry updating:
   - *Diagnostic Header:* In-flight count, average latency, delivery rate.
   - *Route Path Display:* Active path node sequence.
   - *Delay Matrix:* Total calculated serialization and propagation delay.
   - *Congestion Index:* Percentage of congested links.
   - *Latency Chart:* Rolling convergence of average per-packet latency.
   - *Telemetry Log:* Tabular view of all packets with status.
7. **Clean Up** — Clear all traffic or export routing trace data to CSV.

---

## Standalone Local Setup Instructions

This application runs entirely client-side with no server dependencies, build steps, or compilation tools.

### Requirements

- A modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection for first load (Chart.js is fetched from CDN)

### Setup

1. Clone or download the repository containing the six project files.
2. Open `index.html` in any modern web browser.
3. No installation or build step required.

### File Structure

```
network-packet-routing-simulator/
  index.html       — Main application structure
  style.css        — Botanical theme stylesheet
  script.js        — Simulation engine and UI controllers
  thumbnail.svg    — Vector preview graphic
  project.json     — Project metadata
  README.md        — This documentation
```

---

## License

MIT — Free for educational and personal use.
