# Intranet Deployment (Same-Origin)

This setup serves frontend and backend from one server, so login works without a separate public backend URL.

## 1) Prepare environment

Use `.env` values like this:

```env
NODE_ENV=production
PORT=8080

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_db

JWT_SECRET=change-to-a-long-random-secret
CORS_ORIGINS=https://intranet.company.local

SERVE_FRONTEND=true
FRONTEND_BASE_PATH=/
```

Optional build mode file (`.env.intranet`) if you want to override defaults:

```env
VITE_BASE_PATH=/
VITE_API_BASE_URL=
```

## 2) Build frontend

```bash
npm run build:intranet
```

`build:intranet` already forces `base=/` for root hosting.

## 3) Run backend + static frontend

```bash
npm run start
```

## 4) Verify

- `GET http://<server>:8080/health` returns JSON with `ok: true`
- Open `http://<server>:8080/`
- Login uses same-origin API (`/api/auth/login`)

## Notes

- If you host under a sub-path, set both values together:
  - `VITE_BASE_PATH=/KOLAS_Report/`
  - `FRONTEND_BASE_PATH=/KOLAS_Report`
- Keep `VITE_API_BASE_URL` empty for same-origin mode.
