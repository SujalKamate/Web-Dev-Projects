# Sorting Algorithm Lab

An interactive, high-fidelity web application to visualize and analyze the behavior and efficiency of popular sorting algorithms. It helps users understand array elements swapping, partitions, and merges in real-time.

## 🚀 Key Features

*   **Interactive Spectral Canvas Visualizer**:
    *   Dynamic bar graphs representing array elements.
    *   **HSL Value Color-mapping**: Elements are mapped to a color spectrum based on value. Successfully sorted arrays resolve to a beautiful smooth color gradient.
    *   Active visual state highlights: Comparisons (cyan/info), Writes/Swaps (magenta/danger), and Completed Sorted states (emerald/success).
*   **Core Algorithms Visualized**:
    *   **Bubble Sort**: Simple check and swap.
    *   **Selection Sort**: Repeatedly locate minimums and swap them into index order.
    *   **Insertion Sort**: Shift elements into sorted subdivisions.
    *   **Merge Sort**: Visualize divide-and-conquer sub-array divisions merging back in sorted order.
    *   **Quick Sort**: Visualizes Lomuto partitions, pivot element locks, and sub-divisions.
    *   **Heap Sort**: Max Heapify restructuring visualizer.
*   **Rich Control Dashboards & Telemetry**:
    *   Sliders to adjust **Array Size** (10 to 100 elements) and **Speed** of step updates (50ms to 2500ms).
    *   Configure array inputs: **Random array**, **Reversed array** (worst-case), **Nearly sorted** (best-case), or **Custom CSV values**.
    *   Big-O reference cards detailing best, average, worst-case time complexities and space complexities.
    *   Active telemetry metrics: Comparison Count, Array Writes/Swaps Count, and Elapsed Time.
*   **Synchronized Pseudocode Tracker**:
    *   Renders standard code implementations for the selected algorithm.
    *   Highlights the active execution line in real-time.
*   **Historical Benchmark Logs**:
    *   Auto-logs completed runs into a telemetry table so you can compare execution speeds and operation counts of different algorithms on identical inputs.

## 🛠️ Technology Stack

*   **HTML5** for semantic web document structure.
*   **CSS3** for glassmorphism layout modules, dark-theme styling, and responsive layout.
*   **Vanilla JS (ES6)** for sorting algorithms, state frame writing, and DOM updates.
*   **Google Fonts** (Outfit, Fira Code) for polished typography.
*   No external visual dependencies or heavy frameworks!

## 📂 Project Structure

```text
Sorting Algorithm Lab/
├── index.html        # Skeleton structure, panels, and visual canvas container
├── style.css         # Styling system, responsive grid layouts, and active status states
├── script.js         # Operations, sort solvers, and animation queue timeline
├── project.json      # Workspace metadata and entry tags
├── README.md         # Documentation and guide
└── thumbnail.svg     # SVG representation of the visualizer
```

## 🎮 How to Use

1.  Open the `index.html` file in any modern web browser.
2.  Use the **Array Settings** to choose the size and array input type (e.g. Random). Click **Generate New Array**.
3.  Choose your target algorithm from the dropdown (e.g. Quick Sort).
4.  Hit **Play** to animate the sort, or **Step** to check comparisons line-by-line.
5.  Watch the **Comparison** and **Swap** counts increment, and the active pseudocode highlight.
6.  Look at the **Historical Runs** table at the bottom to compare performance.
