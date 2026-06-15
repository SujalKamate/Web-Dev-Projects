# UML Diagram Creator

An interactive client-side design studio that compiles a simple text DSL into professional UML diagrams (Class Diagrams, Use Case Diagrams, and Sequence Diagrams). It features live DSL compiling, a responsive vector viewport (SVG), custom template presets, and interactive zoom, pan, and SVG exports.

## Features

- **Text-to-Diagram Studio**: Write clean text DSL declarations to instantly generate vector layouts (Class Diagrams, Use Case Diagrams, and Sequence Diagrams).
- **Supported UML Types**:
  - **Class Diagrams**: Renders classes with fields/methods compartments and inheritance (`extends` / `->`), composition (`*->`), aggregation (`o->`), or association connections.
  - **Use Case Diagrams**: Render Actor stick figures, oval Use Cases, boundary containers, and routing relations.
  - **Sequence Diagrams**: Render vertical object Lifelines with dashed activation lines and horizontal message arrows.
- **Dynamic Viewport Engine**: Drag the SVG canvas around to pan, zoom in/out/reset with buttons, and click elements to highlight matching script codes.
- **Syntax Diagnostics**: Highlighting syntax errors, missing symbols, or unclosed curly brackets in real-time as you type.
- **Design Presets & Templates**: Includes pre-loaded examples like the Singleton Pattern, Checkout Use Case flow, and Client-Server authentication Sequence.
- **Vector SVG Exporting**: Save your drawn diagrams as high-resolution SVGs natively to your system.

## DSL Syntax Reference Guide

### 1. Class Diagram DSL
```text
class User {
  +string username
  +string email
  +login()
}

class Admin extends User {
  -deleteAccount()
}

User -> Admin : associates
```

### 2. Use Case DSL
```text
actor Customer
actor Admin

usecase Login
usecase Checkout

Customer -> Login
Customer -> Checkout
Admin -> Login
```

### 3. Sequence DSL
```text
Alice -> Bob : Request Token
Bob -> Database : Fetch Record
Database -> Bob : User Info
Bob -> Alice : Token Issued
```

## Run it

Open `index.html` in any modern browser.
