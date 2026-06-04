# Real Estate Listing

A modern, responsive real estate dashboard that allows users to browse property listings, filter by type or location, and save their favorite properties to a persistent list.

## Run it

Open `index.html` in any modern web browser.

Alternatively, for a more production-like environment, serve the project using a local server:

```bash
# Using Python
python -m http.server 8000
```

## Features

- **Dynamic Property Cards**: Displays high-quality visuals, pricing, and property metadata.
- **Advanced Filtering**: Filter properties by type (House, Apartment, Condo) or search by city name.
- **Favorites System**: Save and remove properties from a favorites list that persists via `localStorage`.
- **Responsive Gallery**: A clean, CSS Grid-based layout that adapts to mobile and desktop screens.
- **Keyboard Accessible**: Basic navigation support for interactive elements.

## Tech Stack

- HTML5 (Semantic markup)
- CSS3 (Flexbox, Grid, Custom Properties)
- Vanilla JavaScript (ES6+, DOM Manipulation, LocalStorage)

## Folder Structure

- `index.html`: The main entry point and structure.
- `style.css`: Modern styling and responsive layouts.
- `script.js`: Filtering logic and state management.
- `project.json`: Metadata for the showcase page.