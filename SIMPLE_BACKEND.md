# Simple Backend Quick Start

This is a lightweight backend for login/register/auth-check using SQLite.

## 1) Prepare env

Create `simple-backend/.env` from `simple-backend/.env.example`:

```env
PORT=8080
JWT_SECRET=change-this-secret
CORS_ORIGINS=https://sta115.github.io,http://localhost:3000,http://localhost:5173
SQLITE_FILE=simple-backend/data/auth.db
DEFAULT_ADMIN_ID=admin
DEFAULT_ADMIN_PASSWORD=1234
```

## 2) Run backend locally

```bash
npm run simple-server
```

Health check:

```bash
GET http://localhost:8080/health
```

## 3) Connect frontend

For local frontend (`vite`), use:

```env
VITE_API_BASE_URL=http://localhost:8080
```

For GitHub Pages production, set this before build/deploy:

```env
VITE_API_BASE_URL=https://<your-backend-domain>
```

Then rebuild frontend:

```bash
npm run build
npm run deploy:sta115
```

## 4) API endpoints

- `POST /api/auth/register` (or `/register`)
- `POST /api/auth/login` (or `/login`)
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /health`
