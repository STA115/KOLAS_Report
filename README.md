# STA_TR-Analyzer
시험성적서 분석기능

Deployment guide: see DEPLOY_RENDER.md.
Simple backend guide: see SIMPLE_BACKEND.md.
Intranet same-origin guide: see INTRANET_DEPLOY.md.

## Local Login (Env + Proxy)

1. Copy `.env.example` to `.env` and fill DB values.
2. Keep these values for local login:
   - `PORT=8080`
   - `CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173`
   - `VITE_API_BASE_URL=""`
   - `VITE_PROXY_TARGET=http://localhost:8080`
3. If CORS changes, restart backend server.
4. Run backend and frontend:
   - `npm run server`
   - `npm run dev`

## GitHub Pages Login

- GitHub Pages is static hosting, so login requires a separate backend URL.
- Use fixed backend mode by setting `VITE_API_BASE_URL=https://your-backend.onrender.com`.
- After changing env, rebuild and redeploy pages (`npm run deploy:sta115`).
