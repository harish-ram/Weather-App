# Check Weather — Weather Intelligence Web Application

This repository contains a futuristic Weather Intelligence web application built with React, Vite, TailwindCSS, Framer Motion and Leaflet. It integrates IMD APIs (placeholders), OpenAQ for AQI, and provides a modern UI with glassmorphism, animated backgrounds, and a 3D globe intro.

> Important: IMD API keys and other secrets are not included. Use `.env` to provide keys. See `.env.example`.

## Features

- Dashboard with current weather, AQI summary and 3D globe intro
- Advanced AQI map with clustering, pulsing markers, color legend and heatmap overlay
- Forecasts, Hourly simulation, Rainfall analytics, Nowcast and Alerts panels
- PWA support, dynamic day/night theme, animated backgrounds, and Framer Motion transitions
- Leaflet + MarkerCluster + Heatmap

## Folder structure

```
/src
  /assets         # icons, Lottie JSONs, placeholder images
  /components     # reusable components (maps, legends, drawers)
  /pages          # Dashboard, Maps, Forecasts, Analytics, Alerts
  /shared         # smaller shared UI pieces (cards, mini-panels)
  /lib            # API wrappers for IMD + OpenAQ
  /styles         # extra CSS
  main.jsx
  App.jsx
index.html
vite.config.js
README.md
.env.example
```

## Setup (local)

1. Clone the repo and install dependencies

```bash
git clone https://github.com/harish-ram/Weather-App.git
cd Weather-App
npm install
```

2. Create `.env` from `.env.example` and add your keys

```bash
cp .env.example .env
# edit .env and add IMD and OpenAQ keys
```

3. Run dev server

```bash
npm run dev
```

4. Open http://localhost:5173

## API Keys

- `VITE_IMD_API_KEY` — place your IMD API key here (used by IMD endpoints in `src/lib/api.js`).
- `VITE_OPENAQ_KEY` — OpenAQ v3 key (optional). If not provided, the app will fallback to mock data.
- `VITE_MAPBOX_TOKEN` — Mapbox token if you switch to Mapbox GL (optional).

## How to deploy

### GitHub Pages

1. Push your repository to GitHub (already configured in this project). A GitHub Actions workflow (`.github/workflows/deploy.yml`) is included to build and publish the `dist/` folder to GitHub Pages on push to `main`.
2. Ensure `base` in `vite.config.js` is set to `'/Weather-App/'` for production (already configured).
3. Push and wait for the action to finish. Your site will be available at `https://<username>.github.io/Weather-App/`.

### Vercel

1. Connect your GitHub repo to Vercel.
2. Set build command: `npm run build` and output directory: `dist`.
3. Add environment variables in Vercel dashboard from `.env`.
4. Deploy.

## Screenshots

Placeholders are included in `/assets/screenshots/` — replace them with real screenshots.

## IMD Integration

`src/lib/api.js` contains wrappers for IMD endpoints. IMD APIs vary; the wrappers use placeholders and comments where you should place the official endpoints and parameter mappings.

## Notes & Developer guidance

- The app includes a mock fallback for AQ data to allow local testing without OpenAQ keys.
- For production, do not expose API keys in client code — use a server-side proxy or serverless function to fetch IMD/OpenAQ data and return sanitized results to the client.
- The codebase is component-driven; enhance individual components under `src/components` and `src/shared`.

## Next steps / Improvements

- Add detailed Lottie animations and icons in `/src/assets`.
- Implement station history charts and rainfall histograms using `chart.js`.
- Add offline sync and caching improvements for PWA.

---

If you want, I can now:
- Fill in more detailed IMD endpoint implementations (if you provide API docs)
- Add clustering performance optimizations and marker animations
- Produce real screenshots and demo build

Which of these would you like next?
