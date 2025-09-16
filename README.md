# TRAC Proxy

A minimal Node.js proxy that forwards requests to TRAC and returns the upstream response verbatim.

## Endpoints

- `GET /health` – health check
- `GET /balance/:address` – proxies to `${TRAC_BASE_URL}/balance/:address`

## Local dev

```bash
npm install
npm run dev
# open http://localhost:3001/health
# open http://localhost:3001/balance/<tracAddress>
```

## Build & Run

```bash
npm run build
npm start
```

## Config

- `TRAC_BASE_URL` (default: `http://trac.intern.ungueltig.com:1337`)

## Deploy to Vercel

- Push this folder to a repo.
- `vercel` in the folder, or import the project via the Vercel dashboard.
- The provided `vercel.json` is set up to run Node with `@vercel/node` and pass `TRAC_BASE_URL`.
