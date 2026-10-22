# SAELYN Storefront Starter

## Run locally
1. Install Node.js LTS and VS Code.
2. Extract this ZIP and open the `saelyn-starter` folder in VS Code.
3. Open Terminal > New Terminal.
4. Run `npm install`
5. Run `npm run dev`
6. Open the localhost URL Vite prints (usually http://localhost:5173).

## Commands
- `npm run dev` — development server
- `npm run build` — production build check
- `npm run preview` — preview production build

## Structure
- `src/components/` reusable UI
- `src/data/` editable product data
- `src/styles/tokens.css` centralized design values
- `src/App.jsx` homepage composition

This is the responsive frontend foundation, not a complete commerce backend. Cart, real search, authentication, checkout, APIs and admin tools are future implementation steps. Product photos currently use remote Unsplash URLs; replace with approved assets for production.