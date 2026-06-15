# Disk Scheduling Simulator

An interactive educational tool designed to visualize and compare **Disk Scheduling Algorithms** in Operating Systems. It charts head movements across cylinder tracks and simulates a sweeping disk arm in real time.

## Features

- **Standard Algorithms Configured**:
  - **FCFS (First-Come First-Serve)**: Serves I/O requests sequentially as they arrive.
  - **SSTF (Shortest Seek Time First)**: Selects request closest to current head position, minimizing immediate travel.
  - **SCAN (Elevator)**: Moves head back and forth across the full disk boundary, serving requests in its path.
  - **C-SCAN (Circular SCAN)**: Moves head in one direction to the edge, then jumps back to the opposite edge to repeat.
  - **LOOK**: Similar to SCAN, but reverses direction immediately at the last request in that direction (without traveling to the physical edge of the disk).
  - **C-LOOK**: Circular LOOK. Wraps around from the last request in one direction to the first request in the opposite direction.
- **Interactive Visualizers**:
  - **Seek Graph (Time-Series chart)**: Dynamic coordinate chart drawing the zigzag seek path of the disk head across track numbers.
  - **Concentric Disk Arm Sweep**: An interactive radial visual representing the physical disk platter. A mechanical head arm rotates/sweeps to match the active cylinder tracks in real time.
- **Detailed Analytics Dashboard**:
  - **Seek Time Metrics**: Computes Total Head Movement (seek distance in cylinders) and Average Seek Time.
  - **Multi-Algorithm Compare**: Dynamically parses the current request queue through *every* algorithm and presents seek time comparisons side-by-side, highlighting the most efficient method in neon green.
- **Interactive Simulation Controls**:
  - Play, Pause, Step-Forward, Step-Backward, Reset, and Speed sliders.
  - Custom track requests input fields.
  - Interactive logs showing cylinder calculations.

## Architecture

This project is built using:
- **HTML5**: Semantic tags for core skeleton.
- **CSS3**: Vanilla CSS variables, dark-mode animations, glassmorphism cards, and responsive grids.
- **JavaScript (ES6)**: Modular logic for scheduling computations, SVG drawing, and canvas coordinate translations.
