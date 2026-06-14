# Deadlock Detection Simulator

An interactive educational tool that visualizes deadlock detection algorithms in Operating Systems. It supports both **Resource Allocation Graphs (RAG)** for single-instance resources and the **Banker's Deadlock Detection Algorithm** for multiple-instance resources.

## Features

- **Interactive Graph Editor (RAG)**: Add process and resource nodes (with configurable instance counts), draw allocation/request edges, drag nodes to layout, and delete elements easily.
- **Visual Cycle Detection**: Traverses the graph in real-time, highlights active exploration, and flashes any detected cycles in pulsing neon red.
- **Banker's Detection Simulator**: Full tabular interface showing Allocation Matrix, Request Matrix, and Available Vector. Supports step-by-step interactive runs, play/pause, speed scaling, and full execution trace logs.
- **Preset Scenarios**: Quickly load classic OS textbook cases including:
  - Single-instance cycle (Deadlocked)
  - Single-instance no-cycle (Safe)
  - Multi-instance cycle (Safe - resolves via termination of independent processes)
  - Multi-instance cycle (Deadlocked)
- **Modern UI/UX**: Sleek dark space theme, fluid glassmorphism components, and responsive layout for mobile and desktop screens.

## Architecture

This project is built using:
- **HTML5**: Semantic tags for clean structure.
- **CSS3**: Vanilla CSS styling featuring custom variables, CSS Grid/Flexbox, smooth animations, and transitions.
- **JavaScript (ES6)**: Modular, client-side application logic using standard DOM APIs and SVG rendering for graph drawing.
