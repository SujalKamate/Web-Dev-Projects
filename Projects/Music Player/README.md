# Music Player

An iPhone-style audio player built with HTML, CSS and the native `<audio>` API, featuring iTunes Search integration.

## Features

- Sleek, iOS-inspired card UI with bold album art tiles.
- **iTunes Search API integration** for fetching real music data dynamically.
- Display album artwork thumbnails for tracks (from iTunes API or gradient fallback).
- Show top 5 songs based on your search query.
- Track details: Song title, artist name, and album name.
- Play, pause, next, previous and a draggable scrubber.
- Real-time progress, elapsed and remaining time.
- Queue list rendered from local data or API results.
- **30-second preview playback** (iTunes API provides preview URLs).
- **Loading and error states** for API requests.
- Respects `prefers-reduced-motion` and is fully keyboard navigable.

## Run it

Open `index.html` in any modern browser. The player includes:
- **Default tracks**: A starter playlist with free CDN-hosted preview audio.
- **Search feature**: Use the search bar at the top to find songs from iTunes database (supports any music genre, including Indian Bollywood songs).

## What it shows

- Custom iTunes Search API integration (no build tools, pure fetch API).
- Handling dynamic data from external APIs in vanilla JavaScript.
- Error handling and loading states for better UX.
- The HTMLMediaElement API (`timeupdate`, `ended`, `play`, `pause`).
- Dynamic DOM rendering for search results.
- Responsive design for both fixed tracks and API results.

## Supported searches

- Artist names: "Shah Rukh Khan", "Arijit Singh"
- Song titles: "Kabhi Alvida Naa Kehna", "Tum Hi Ho"
- Album names: "Dilwale Dulhania Le Jayenge", "Ae Dil Hai Mushkil"
- General queries: "bollywood", "hindi songs", etc.

## Credits

- Built with the iTunes Search API ([Apple Search API Documentation](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/))
- Default soundtrack uses free CDN-hosted audio samples.

