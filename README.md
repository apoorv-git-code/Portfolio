# Apoorv Mishra Portfolio — refreshed static site

This is a refreshed version of the existing HTML/CSS/JavaScript portfolio. It keeps the current structure and content while adding:
- Warm, light theme by default with a persistent light/dark toggle
- Responsive layout and mobile navigation
- Scroll-reveal and terminal typing animations (respects reduced-motion preferences)
- A contact form that validates fields and opens the visitor's email app with a prefilled message

## Run locally
Open `index.html` in a browser, or serve this folder with any static web server.

## Deploy to the existing Vercel project
1. Extract this ZIP.
2. Replace the existing repository's `index.html`, `style.css`, and `script.js` with these versions.
3. Commit and push to the same GitHub repository connected to your existing Vercel project.
4. Vercel should build/deploy automatically. Check the deployment preview before promoting it if your project uses preview deployments.

No framework or build command is required for these three static files.

## Contact form note
The form does not send messages to a server. It uses `mailto:` to open the visitor's configured email application, addressed to `apoorv.mishra.dev@gmail.com`. For server-side submissions, connect a form service or backend endpoint.
