# Picture QR Generator

A pure client-side web page that turns a photo + a link into a scannable, printable QR code while keeping the picture clearly visible.

Perfect for GitHub Pages.

## Features

- Upload any image
- Enter any URL / link
- Two generation modes:
  - **Logo in Center** (recommended) – high error-correction QR with your picture cleanly placed in the middle
  - **Artistic Blend** – the picture is composited into the QR modules so it stays very visible
- Adjustable size, colors, error-correction level, logo size and quiet zone
- One-click PNG download optimized for printing
- 100 % client-side – nothing is uploaded to any server

## How to deploy on GitHub Pages

1. Create a new repository (or use an existing one).
2. Upload the contents of this folder (`index.html`, `styles.css`, `app.js`, `README.md`) to the repository root **or** to a `/docs` folder.
3. Go to **Settings → Pages**.
4. Under **Source**, choose:
   - Deploy from a branch → `main` (or `master`) → `/ (root)`  
     **or**
   - Deploy from a branch → `main` → `/docs`
5. Save. After a minute your site will be live at  
   `https://YOUR-USERNAME.github.io/REPO-NAME/`

## Local testing

Just open `index.html` in any modern browser. No build step required.

## Tips for best results

- Prefer high-contrast, reasonably simple images.
- Always choose **High (H)** error correction when using a logo or artistic mode.
- Test the generated PNG with a phone camera before printing at large size.
- For maximum reliability use **Logo in Center** mode.

## License

MIT – free for personal and commercial use.
