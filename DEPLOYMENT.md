# Deploying to GitHub Pages

1. Make sure your repository is initialized with a remote on GitHub.
2. Run `npm install` to ensure all dependencies are installed.
3. To deploy, run:

    npm run deploy

This will build your project and publish the contents of the `dist` folder to the `gh-pages` branch.

## First-time setup
- Ensure your repository is public (or GitHub Pages is enabled for private repos).
- In your repository settings on GitHub, set GitHub Pages to use the `gh-pages` branch as the source.
- After deploying, your site will be available at:
  `https://<your-username>.github.io/<your-repo-name>/`

## Notes
- Every time you push changes to your main branch, run `npm run deploy` to update the GitHub Pages site.
- The `gh-pages` branch is managed automatically; you do not need to edit it manually.
