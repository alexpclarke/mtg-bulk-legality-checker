# MTG Bulk Legality Checker

A static Vue.js app to check the legality of Magic: The Gathering decklists against bulk CSV data files.

## Usage

1. Place your CSV data files in the `data_files/` directory.
2. Open `index.html` in your browser (or deploy to GitHub Pages).
3. Select a data file, paste your decklist (as from Moxfield), and check legality.

- If all cards are legal, you'll see "All legal".
- Illegal cards are listed with the reason and a Scryfall link.

### Notes
- The sideboard and the last line (commander) are ignored.
- If a card is not found in the data, it is considered illegal ("card not found").
- The app is fully static and can be hosted for free (e.g., GitHub Pages).

## Local Development

To start the dev server and always use the latest CSV file list:

```
npm run dev
```

Or just open `index.html` directly in your browser (after running `npm run generate-manifest` to update the file list).

## Deploying to GitHub Pages

To build and deploy (including updating the CSV file list):

```
npm run build-and-deploy
```

This will:
- Generate the CSV file manifest (data_files/index.json)
- Copy `index.html` to `404.html` (for SPA routing)
- Deploy to GitHub Pages

In your GitHub repository settings, set GitHub Pages source to the `gh-pages` branch. Your app will be live at `https://<your-username>.github.io/<repo-name>`.