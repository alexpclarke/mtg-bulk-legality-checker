# MTG Bulk Legality Checker

A web app to check the legality of Magic: The Gathering cards in bulk, using Scryfall data.

## Features
- Paste a decklist and check legality for Commander format
- Uses up-to-date Scryfall bulk data
- Simple, static, and fast

## Usage
1. Clone the repo
2. Run `npm install`
3. Run `npm run build` to generate the `dist/` folder
4. Deploy or serve the `dist/` folder as a static site

## Development
- Source files: `src/`
- Build script: `scripts/build.js`
- Data files: `src/data_files/`

## Deployment
- GitHub Actions workflow auto-deploys `dist/` to GitHub Pages on every push to `main`

## Requirements
- Node.js 20+ (see `.nvmrc`)

## Updating Data
- Run `main.py` to fetch and process new Scryfall data

---
MIT License

