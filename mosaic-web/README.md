# Mosaic — Web Demo

A static, single-page demo of the [Mosaic](https://github.com/aditauqir/mosaic) credit-report analysis app.
It shows the marquee features — change detection between report snapshots, an AI risk summary, and an
editable recovery/dispute letter — using **synthetic data only**.

- **No server.** Pure static files (HTML/CSS/JS).
- **No runtime API calls.** AI content is **pre-generated** and served as JSON in `data/ai.json`.
- **No real data.** The "reports" are fictional people in `data/reports.json`.
- **$0 to host.** Deploy to Vercel, Netlify, Cloudflare Pages, or GitHub Pages for free.

## Run it locally

Because it fetches JSON, open it through a tiny static server (not `file://`):

```bash
npx serve .
# then open the printed http://localhost:3000
```

Or with Python: `python -m http.server` then open http://localhost:8000

## Deploy (free)

**Vercel:** push this folder to a GitHub repo, then "Import Project" in Vercel — it auto-detects a static
site, no config needed. You get a free `*.vercel.app` URL.

**GitHub Pages:** push to a repo, Settings → Pages → deploy from the `main` branch root.

No environment variables. No API key. Nothing to leak.

## How the AI content is made

The live site uses the AI text already saved in `data/ai.json`. That file was produced by
`scripts/generate-ai.mjs`, which is the **only** thing that ever calls Google Gemini — and you run it
**locally, once**, never in production.

To regenerate (optional):

1. Get a free key at https://aistudio.google.com → "Get API key".
2. Run:
   ```bash
   # macOS/Linux
   GEMINI_API_KEY=your_key node scripts/generate-ai.mjs
   # Windows PowerShell
   $env:GEMINI_API_KEY="your_key"; node scripts/generate-ai.mjs
   ```
3. Commit the updated `data/ai.json` and redeploy.

The script sends only the synthetic, masked report facts to Gemini, mirroring Mosaic's
"only redacted info leaves the device" design.

## Add or edit a report

Edit `data/reports.json`. Each report has a `baseline` and a `current` snapshot; the app diffs them to
find new accounts, balance jumps, and new hard inquiries. After changing report facts, rerun the
generate script (or hand-edit `data/ai.json`) so the AI summary matches.

## File map

```
index.html          UI shell
styles.css          styling
app.js              loads data, computes the diff, renders
data/reports.json   synthetic reports (baseline vs current)
data/ai.json        pre-generated AI summaries + letters
scripts/generate-ai.mjs   optional: regenerate ai.json with your own Gemini key
```
