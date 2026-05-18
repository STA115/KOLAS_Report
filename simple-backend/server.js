import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), 'simple-backend/.env') });
dotenv.config();

const normalize = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const isProduction = normalize(process.env.NODE_ENV).toLowerCase() === 'production';
const port = Number(process.env.PORT || 8080);
const jwtSecret = normalize(process.env.JWT_SECRET) || 'dev-only-change-this-secret';
const authCookieName = normalize(process.env.AUTH_COOKIE_NAME) || 'kolas_auth_token';
const authTokenExpiresIn = normalize(process.env.AUTH_TOKEN_EXPIRES_IN) || '1h';
const authCookieMaxAgeMs = Math.max(60_000, Number(process.env.AUTH_COOKIE_MAX_AGE_MS || 3_600_000));
const sqliteFilePath = path.resolve(process.cwd(), normalize(process.env.SQLITE_FILE) || 'simple-backend/data/auth.db');

fs.mkdirSync(path.dirname(sqliteFilePath), { recursive: true });
const db = new Database(sqliteFilePath);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS member (
    id TEXT PRIMARY KEY,
    pwd TEXT NOT NULL,
    email TEXT DEFAULT '',
    admin_flag TEXT DEFAULT '0',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$/.test(String(value || ''));
const findMemberStmt = db.prepare('SELECT id, pwd, email, admin_flag FROM member WHERE id = ? LIMIT 1');
const insertMemberStmt = db.prepare('INSERT INTO member (id, pwd, email, admin_flag) VALUES (?, ?, ?, ?)');
const updatePasswordStmt = db.prepare('UPDATE member SET pwd = ? WHERE id = ?');

const defaultAdminId = normalize(process.env.DEFAULT_ADMIN_ID);
const defaultAdminPassword = normalize(process.env.DEFAULT_ADMIN_PASSWORD);
const defaultAdminEmail = normalize(process.env.DEFAULT_ADMIN_EMAIL);

if (defaultAdminId && defaultAdminPassword) {
  const exists = findMemberStmt.get(defaultAdminId);
  if (!exists) {
    const hash = bcrypt.hashSync(defaultAdminPassword, 12);
    insertMemberStmt.run(defaultAdminId, hash, defaultAdminEmail, '1');
    console.log('[INIT] Default admin user created');
  }
}

const configuredCorsOrigins = normalize(process.env.CORS_ORIGINS || process.env.CORS_ORIGIN)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || configuredCorsOrigins.length === 0) return callback(null, true);
    if (configuredCorsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many register attempts. Please try again later.' },
});

const makeMemberPayload = (row) => ({
  id: normalize(row?.id),
  email: normalize(row?.email),
  admin_flag: normalize(row?.admin_flag) || '0',
});

const signAuthToken = (member) =>
  jwt.sign(
    {
      id: member.id,
      email: member.email,
      admin_flag: member.admin_flag,
    },
    jwtSecret,
    { expiresIn: authTokenExpiresIn },
  );

const setAuthCookie = (res, token) => {
  res.cookie(authCookieName, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: authCookieMaxAgeMs,
    path: '/',
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(authCookieName, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
};

const extractToken = (req) => {
  const cookieToken = normalize(req.cookies?.[authCookieName]);
  if (cookieToken) return cookieToken;

  const authHeader = normalize(req.headers?.authorization);
  if (!authHeader) return '';

  const [scheme, token] = authHeader.split(/\s+/, 2);
  if (normalize(scheme).toLowerCase() !== 'bearer') return '';
  return normalize(token);
};

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'simple-backend',
    now: new Date().toISOString(),
  });
});

const handleRegister = (req, res) => {
  try {
    const id = normalize(req.body?.id);
    const pwd = normalize(req.body?.pwd);
    const email = normalize(req.body?.email);

    if (!id || !pwd) {
      return res.status(400).json({ error: 'id and pwd are required.' });
    }
    if (pwd.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    const exists = findMemberStmt.get(id);
    if (exists) {
      return res.status(409).json({ error: 'ID already exists.' });
    }

    const hash = bcrypt.hashSync(pwd, 12);
    insertMemberStmt.run(id, hash, email, '0');
    return res.json({ success: true, message: 'Registered successfully.' });
  } catch (error) {
    console.error('[AUTH] register error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

app.post('/api/auth/register', registerLimiter, handleRegister);
app.post('/register', registerLimiter, handleRegister);

const handleLogin = (req, res) => {
  try {
    const id = normalize(req.body?.id);
    const pwd = normalize(req.body?.pwd);

    if (!id || !pwd) {
      return res.status(400).json({ error: 'id and pwd are required.' });
    }

    const memberRow = findMemberStmt.get(id);
    if (!memberRow) {
      return res.status(401).json({ error: 'Invalid id or password.' });
    }

    const storedPwd = normalize(memberRow.pwd);
    const matched = isBcryptHash(storedPwd)
      ? bcrypt.compareSync(pwd, storedPwd)
      : storedPwd === pwd;
    if (!matched) {
      return res.status(401).json({ error: 'Invalid id or password.' });
    }

    if (!isBcryptHash(storedPwd)) {
      const hash = bcrypt.hashSync(pwd, 12);
      updatePasswordStmt.run(hash, id);
    }

    const member = makeMemberPayload(memberRow);
    const token = signAuthToken(member);
    setAuthCookie(res, token);

    return res.json({ success: true, member });
  } catch (error) {
    console.error('[AUTH] login error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

app.post('/api/auth/login', loginLimiter, handleLogin);
app.post('/login', loginLimiter, handleLogin);

app.get('/api/auth/me', (req, res) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'No auth token.' });

    let payload;
    try {
      payload = jwt.verify(token, jwtSecret);
    } catch {
      return res.status(401).json({ error: 'Invalid auth token.' });
    }

    const memberId = normalize(payload?.id);
    if (!memberId) return res.status(401).json({ error: 'Invalid auth token.' });

    const memberRow = findMemberStmt.get(memberId);
    if (!memberRow) return res.status(401).json({ error: 'Member not found.' });

    return res.json({ success: true, member: makeMemberPayload(memberRow) });
  } catch (error) {
    console.error('[AUTH] me error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  return res.json({ success: true, message: 'Logged out.' });
});

app.use((err, _req, res, _next) => {
  if (String(err?.message || '').includes('CORS')) {
    return res.status(403).json({ error: 'CORS blocked this origin.' });
  }
  return res.status(500).json({ error: 'Internal server error.' });
});

const server = app.listen(port, () => {
  console.log(`[simple-backend] listening on port ${port}`);
  console.log(`[simple-backend] sqlite file: ${sqliteFilePath}`);
  if (!normalize(process.env.JWT_SECRET) && !isProduction) {
    console.log('[simple-backend] JWT_SECRET not set, using development default');
  }
});

const shutdown = () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
