# Weather Finder

A clean, minimal weather app that fetches live temperature, humidity, wind speed and sky conditions for any city using the Open-Meteo API — no API key required.

## Run it

Open `index.html` in any modern browser.

## Features

- Search any city by name using the Open-Meteo Geocoding API
- Displays temperature (°C), weather condition, humidity and wind speed
- Weather condition icon updates based on WMO weather code
- Fully keyboard accessible — press Enter to search
- No console errors, no tracking scripts, no API key needed

## What I learned

- Chaining two `fetch` calls (geocoding → weather)
- Mapping WMO weather codes to human-readable conditions
- Keeping UI state clean without a framework
