# Interactive DSA Visualizer 🚀

An interactive, client-side educational platform designed to visualize core Data Structures and Algorithms (DSA) in real time. Visualize operations on Linked Lists, Stacks, Queues, Binary Search Trees (BST), and Graphs, accompanied by pseudo-code tracing, visual step logs, and algorithmic complexities.

## 🚀 Key Features

*   **Diverse Data Structures Supported**:
    *   **Linked List**: Visualize Singly Linked List insertion (head/tail/index), deletion (head/tail/index), and sequential searches.
    *   **Stack & Queue**: Observe push/pop behaviors on stacks (rendered vertically) and enqueue/dequeue slides on queues (rendered horizontally).
    *   **Binary Search Tree (BST)**: View comparative pathways during node insertions, deletions, searches, and recursive tree traversals (In-order, Pre-order, Post-order, BFS).
    *   **Graph Algorithms**: Create vertices by clicking directly on the canvas, connect them by dragging edges, and run BFS, DFS, or Dijkstra's shortest path algorithm.
*   **Step-by-Step Execution Playback**:
    *   Pause, resume, step forward, or adjust animation speed of algorithms.
    *   Visual console displaying logical transitions (e.g., "Node 15 is greater than 10; traversing to the right subtree").
    *   **Pseudo-Code Trace Panel**: Highlights the active line of pseudo-code being executed in real time.
*   **Highly Interactive SVG Canvas**: Nodes, pointers, and edges are rendered as interactive vector components with hover tooltips.
*   **Aesthetics & Theming**: Futuristic glassmorphic sidebar options, dark mode defaults with a light mode toggle, and micro-animations.

## ⌨️ Keyboard Shortcuts

*   `Alt + 1`: Switch workspace to Linked List mode
*   `Alt + 2`: Switch workspace to Stack & Queue mode
*   `Alt + 3`: Switch workspace to Binary Search Tree mode
*   `Alt + 4`: Switch workspace to Graph mode
*   `Space`: Play / Pause active animation playback
*   `Alt + C`: Clear current data structure state
*   `Alt + S`: Seed sample data values

## 🛠️ Technology Stack

*   **Structure**: Semantic HTML5 markup
*   **Styling**: Vanilla CSS3 (Custom properties, HSL color tokens, glassmorphic layout cards)
*   **Scripting**: Vanilla JS (SVG rendering, custom animation queues, event binding)

## 📦 File Structure

```
Interactive DSA Visualizer/
├── index.html       # Sidebar controls, canvas views, and pseudo-code frames
├── style.css        # Visual styling, animation rates, and active node glows
├── script.js        # Graph managers, BST tree engines, and step controller queues
├── project.json     # Project meta-attributes
├── thumbnail.svg    # Dashboard overview illustration
└── README.md        # Operations manual
```

## 🚀 How to Run

1. Navigate to the folder `Projects/Interactive DSA Visualizer/`.
2. Open `index.html` in your web browser.
