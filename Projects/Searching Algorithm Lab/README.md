# Searching Algorithm Lab

An interactive, high-fidelity web application to visualize and analyze the behavior and efficiency of popular searching algorithms on linear arrays.

## 🚀 Key Features

*   **Interactive Visual Array Canvas**:
    *   Dynamic bar graphs representing array elements.
    *   **Search space reduction visualization**: Shaded or faded out elements show index blocks that are eliminated from the active search space.
    *   Floating pointer flags: Pointers float above nodes to trace `Low`, `High`, `Mid`, and `Target` indices.
    *   Active visual state highlights: Comparisons (cyan/info), Target Found (success/green), and Discarded/Out-of-Bounds (low opacity/dimmed).
*   **Searching Algorithms Visualized**:
    *   **Linear Search**: Scans elements one by one sequentially from left to right. Works on unsorted arrays.
    *   **Binary Search**: Divide-and-conquer on sorted arrays, recursively cutting the search space in half.
    *   **Jump Search**: Jumps forward by fixed blocks of $\sqrt{n}$ to locate the target block, then performs a linear scan.
    *   **Interpolation Search**: Evaluates target index positioning using a linear interpolation mathematical equation. Highly efficient on uniformly distributed sorted arrays.
*   **Rich Control Dashboards & Telemetry**:
    *   Adjust array size (10 to 100 elements) and step-animation speed (50ms to 2500ms).
    *   Select array distribution profiles: **Uniformly Distributed**, **Skewed distribution**, or **Custom comma-separated values**.
    *   Interactive Click-to-Search: Directly click any bar on the visual canvas to automatically set its value as the search query.
    *   Live telemetry tracking: Comparison Count, Search Space Reduction Factor (%), and Active Pointer Indices.
    *   Big-O reference cards detailing best, average, and worst-case time complexities and space complexities.
*   **Synchronized Pseudocode Tracker**:
    *   Renders standard code implementations for the selected algorithm.
    *   Highlights the active execution line in real-time.
*   **Historical Query Logs**:
    *   Auto-logs completed search runs into a telemetry table to compare comparisons, space reduction rate, and elapsed time.

## 🛠️ Technology Stack

*   **HTML5** for semantic web document structure.
*   **CSS3** for glassmorphism layout modules, dark-theme styling, and responsive layout.
*   **Vanilla JS (ES6)** for searching algorithms, state frame writing, and DOM updates.
*   **Google Fonts** (Outfit, Fira Code) for polished typography.
*   No external visual dependencies or heavy frameworks!

## 📂 Project Structure

```text
Searching Algorithm Lab/
├── index.html        # Skeleton structure, panels, and visual canvas container
├── style.css         # Styling system, responsive grid layouts, and active status states
├── script.js         # Operations, search solvers, and animation queue timeline
├── project.json      # Workspace metadata and entry tags
├── README.md         # Documentation and guide
└── thumbnail.svg     # SVG representation of the visualizer
```

## 🎮 How to Use

1.  Open the `index.html` file in any modern web browser.
2.  Use the **Array Settings** to choose the size and array input type (e.g. Uniform). Click **Generate New Array**.
3.  Choose your target algorithm from the dropdown (e.g. Binary Search). Notice the array automatically sorts if required!
4.  Enter a target search value in the input field OR click any bar directly on the canvas to set it as the query target.
5.  Hit **Play** to animate the search.
6.  Look at the **Historical Query Logs** table at the bottom to compare search metrics.
