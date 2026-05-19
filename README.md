# My Site

Generic static site for GitHub Pages.

## Deploy

1. Create a public repo named `<your-username>.github.io` on GitHub.
2. From this directory:
   ```
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-username>.github.io.git
   git push -u origin main
   ```
3. In the repo on GitHub: **Settings → Pages** → confirm source is `main` / root.
4. Visit `https://<your-username>.github.io` (allow a minute for first build).

## Local preview

- Double-click `index.html`, or
- `python -m http.server` and open http://localhost:8000
