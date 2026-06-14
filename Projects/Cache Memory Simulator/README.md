# Cache Memory Simulator

An interactive, visual simulator for understanding cache memory architecture, address translation, mapping techniques, and block replacement policies in modern CPUs.

## Features

- **Interactive Configuration**:
  - **Mapping Techniques**: Direct Mapping, N-Way Set Associative (2-Way, 4-Way, 8-Way), and Fully Associative.
  - **Replacement Policies**: Least Recently Used (LRU), First-In First-Out (FIFO), Least Frequently Used (LFU), and Random.
  - **Write Policies**: Write-Through and Write-Back.
  - **Dimensions**: Configurable Cache Size, Block (Line) Size, and Main Memory Size.
- **Address Breakdown Display**:
  - Decodes any 8-bit or 16-bit binary memory address in real time into **Tag**, **Index**, and **Offset** bits.
- **Dynamic Visual Layout**:
  - Interactive Cache table displaying line indices, validity bits, dirty bits, tags, and data blocks.
  - Scrollable Main Memory view tracking data block coordinates and highlighting loaded cache blocks.
- **Step-by-Step CPU Simulator**:
  - Run individual reads/writes to memory addresses.
  - Animate search paths: checks the index set, performs tag comparison, highlights hits in green, misses in orange/red, and visualizes block updates and dirty write-backs.
- **Access Streams & Locality Presets**:
  - Run streams of multiple memory accesses.
  - Load educational presets demonstrating:
    - Spatial Locality (sequential array access)
    - Temporal Locality (repeated loop access)
    - Cache Thrashing (conflict misses in direct mapping)
- **Live Statistics**:
  - Visual metrics displaying Total Accesses, Hit/Miss counters, and Hit Rate percentages.
  - Dynamic request history table.

## Architecture

This project is built using:
- **HTML5**: Semantic elements for modern layout structure.
- **CSS3**: Responsive grids, custom scrollbars, layout panels, and fluid transition animations.
- **JavaScript (ES6)**: Modular logic implementing address decoding math, replacement policy lists, hit-testing algorithms, and rendering updates.
