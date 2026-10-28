# TTLO – Transformer Truck Loading Optimizer · v1.0

VOLTAMP Power Transformers. Built by Mohammed K. Al AbdulSalam.

TTLO turns a transformer packing box list (Excel) into a truck loading plan: Low Beds for each main unit
with its rollers, Flat Beds or 40ft HC containers for the accessories, a 3D and 2D view of every truck,
load balance checks and a PDF loading plan.

## What is in this folder

| Path | What it is |
|---|---|
| `public/` | **The whole website.** `index.html` plus `vendor/` (3D, Excel and PDF libraries and fonts, all stored locally). Copy this folder to any web server. |
| `wrangler.jsonc` | Cloudflare Workers settings (serves `public/`). |
| `.github/workflows/deploy.yml` | CI: on every push the tests run on GitHub. Cloudflare deploys `main` by itself. |
| `Dockerfile`, `server/nginx/` | Company server option with Docker + nginx. |
| `server/iis/web.config` | Company server option with Windows IIS. |
| `tests/` | `serve.mjs` (local server) and `smoke.mjs` (automatic checks). |

The site is static: no database, no server code, no login. Projects are saved only in the user's own
browser (My Projects) or exported as `.ttlo.json` files. Nothing is sent to any server, and the site needs
no internet connection once it is loaded from your server.

## Run it on your computer

```bash
npm install
npm start            # opens on http://localhost:8080
```
(Opening `index.html` directly from disk does not work: browsers block the 3D modules on `file://`.
Any web server works, for example `python -m http.server 8080` inside `public/`.)

## Check it

```bash
npx playwright install chromium   # first time only
npm test                          # tests ./public
TTLO_URL=https://ttlo.example/ npm test   # tests a deployed copy
```
The test builds the PT0525 sample plan with the internet blocked and checks: 15 trucks, each main unit with
its rollers on a Low Bed, 36 oil-drum pallets, all 90 packages planned, no trailer part or cargo model
overlapping on any truck, the PDF builds, a file download starts, no page errors.

## Option A – Cloudflare (with CI/CD)

The repository is connected to Cloudflare (*Workers & Pages → ttlo → Settings → Builds*). On every push to
`main`, Cloudflare runs `npx wrangler deploy` and publishes `public/`. At the same time GitHub Actions runs
`npm test` (`.github/workflows/deploy.yml`); check that it is green.

- The `"name"` in `wrangler.jsonc` must match the Worker name on Cloudflare (`ttlo`).
- The whole folder must be in the repository, including `public/` and `.github/`. When uploading through
  the GitHub website, drag the folders onto the page (the file picker skips folders), or use GitHub Desktop.

Manual deploy without GitHub: `npx wrangler login` then `npx wrangler deploy`.

## Option B – Company server

**Any web server:** copy the contents of `public/` into the site folder. That is all.

**Docker + nginx:**
```bash
docker build -t ttlo:1.0 .
docker run -d -p 8080:80 --name ttlo ttlo:1.0
```

**Windows IIS:** copy `public/` into the site folder and put `server/iis/web.config` next to `index.html`.

For CI/CD on the company server, the IT pipeline can run `npm ci && npx playwright install --with-deps chromium && npm test`
and then publish `public/` (or build the Docker image) on every push to `main`.

## Updating

All of the app is `public/index.html`. Change it, run `npm test`, push to `main`.
Change the version in three places: the header chip and footer in `index.html` (`v1.0`) and `package.json`.

## Third-party libraries (in `public/vendor/`, licences in `public/vendor/licenses/`)

three.js 0.160.0 (MIT) · SheetJS xlsx 0.18.5 (Apache-2.0) · html2canvas 1.4.1 (MIT) · jsPDF 2.5.1 (MIT) ·
Archivo, IBM Plex Sans, IBM Plex Mono fonts (SIL Open Font License).
