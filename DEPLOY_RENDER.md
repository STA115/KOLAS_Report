# Deploy Backend (Render) + MySQL + GitHub Pages Frontend

This project uses:
- Frontend: GitHub Pages (`https://sta115.github.io/KOLAS_Report/`)
- Backend API: Node/Express (`server.js`)
- Database: MySQL

`VITE_API_BASE_URL` must point to your deployed backend URL, not GitHub Pages URL.

## 1. Prepare backend environment values

Use these keys in your backend host (Render):

- `PORT` = `10000` (Render sets this automatically, but keep key name)
- `OPENAI_API_KEY` = your key
- `OPENAI_MODEL` = `gpt-4.1-mini` (or your choice)
- `DB_HOST` = your MySQL host
- `DB_PORT` = your MySQL port (usually `3306`)
- `DB_USER` = your MySQL user
- `DB_PASSWORD` = your MySQL password
- `DB_NAME` = your database name
- `DB_SSL` = `true` for managed DBs that require TLS, else `false`
- `DB_SSL_REJECT_UNAUTHORIZED` = `true` (change only if provider requires otherwise)
- `CORS_ORIGINS` = `https://sta115.github.io,http://localhost:3000,http://localhost:5173`

## 2. Create Render service

1. Push this repo to GitHub.
2. In Render, choose `New +` -> `Web Service`.
3. Connect this repository.
4. Use:
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm run start`
5. Set all environment variables from step 1.
6. Deploy.

After deploy, verify:
- `GET https://<your-render-domain>/health` returns `{ "ok": true, ... }`

## 3. Connect frontend to backend

In local `.env`:

```env
VITE_API_BASE_URL="https://<your-render-domain>"
```

Then rebuild and redeploy frontend:

```bash
npm run build
npm run deploy
```

## 4. GitHub Pages settings check

- Repository: `sta115/KOLAS_Report`
- Pages source should serve the built `dist` output (via `gh-pages` branch if you use `npm run deploy`).
- Vite `base` is set to `/KOLAS_Report/`.

## 5. Quick troubleshooting

- Login stuck on "Checking...":
  - Usually backend URL missing or backend unreachable.
- `CORS` error in browser console:
  - Add your frontend origin to `CORS_ORIGINS`.
- DB connection errors:
  - Verify `DB_*` values and whether `DB_SSL=true` is required by your MySQL provider.
