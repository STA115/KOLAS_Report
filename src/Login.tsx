import React, { useState } from 'react';
import { getEnvApiBaseUrl, isGithubPagesHost, resolveConfiguredApiBaseUrl } from './utils/apiBase';

interface LoginProps {
  onLogin: (id?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [p_id, setp_id] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isDev = Boolean((import.meta as any).env?.DEV);
  const isGithubPages = isGithubPagesHost();
  const envApiBase = getEnvApiBaseUrl();

  const saveSession = (member: { id?: string; email?: string; admin_flag?: string }) => {
    const expire = Date.now() + 60 * 60 * 1000;
    localStorage.setItem('session_expire', expire.toString());
    localStorage.setItem('member', JSON.stringify(member));
    if (member?.id) {
      localStorage.setItem('login_id', member.id);
    }
  };

  const getLoginUrlCandidates = () => {
    if (isGithubPages) {
      if (!envApiBase) return [];
      return Array.from(new Set([`${envApiBase}/api/auth/login`, `${envApiBase}/login`]));
    }

    const apiBase = resolveConfiguredApiBaseUrl();
    const urls = apiBase
      ? [`${apiBase}/api/auth/login`, `${apiBase}/login`]
      : isDev
        ? ['/api/auth/login', '/login']
        : ['/api/auth/login', '/login'];

    return Array.from(new Set(urls));
  };

  const handleApiLogin = async () => {
    const loginUrls = getLoginUrlCandidates();
    if (loginUrls.length === 0) {
      throw new Error(
        'Admin setup required: set VITE_API_BASE_URL to backend URL and redeploy GitHub Pages.',
      );
    }

    let data: any = {};
    let lastError: Error | null = null;
    let loginSuccess = false;

    for (const loginUrl of loginUrls) {
      try {
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            id: p_id,
            pwd: password,
          }),
        });

        const rawBody = await response.text();
        data = {};
        if (rawBody) {
          try {
            data = JSON.parse(rawBody);
          } catch {
            data = { rawText: rawBody };
          }
        }

        if (!response.ok) {
          const serverMessage = data?.error || data?.message || data?.rawText || `${response.status} ${response.statusText}`;
          if (response.status === 404 || response.status === 405) {
            lastError = new Error(`[${response.status}] ${serverMessage}`);
            continue;
          }
          throw new Error(`[${response.status}] ${serverMessage}`);
        }

        loginSuccess = !!data?.success;
        if (!loginSuccess) {
          const failMessage = data?.error || data?.message || data?.rawText || 'Invalid login credentials.';
          setError(failMessage);
          alert(`Login failed: ${failMessage}`);
          return;
        }
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    if (!loginSuccess) {
      throw lastError || new Error('Cannot reach login server.');
    }

    if (data?.success) {
      saveSession(data.member || { id: p_id });
      alert('Logged in successfully.');
      onLogin(data?.member?.id || p_id);
    } else {
      const failMessage = data?.error || data?.message || data?.rawText || 'Login failed.';
      setError(failMessage);
      alert(`Login failed: ${failMessage}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p_id || !password) {
      setError('Please enter both ID and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await handleApiLogin();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Server connection error: ${errorMsg}`);
      alert(`Server connection failed\n\nDetails:\n${errorMsg}`);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 32, color: '#1976d2', letterSpacing: 2, textAlign: 'center' }}>KOLAS</div>
      <form onSubmit={handleSubmit} style={{ width: 320 }}>
        {isGithubPages && !envApiBase && (
          <div style={{ marginBottom: 12, border: '1px solid #90caf9', borderRadius: 6, padding: 10, background: '#f3f9ff', color: '#0d47a1', fontSize: 13 }}>
            Admin setup required: set `VITE_API_BASE_URL` and redeploy.
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #1976d2' }}>
          <tbody>
            <tr>
              <td style={{ backgroundColor: '#1976d2', color: 'white', width: 90, textAlign: 'center', padding: 10, border: '1px solid #1976d2' }}>ID</td>
              <td style={{ padding: 10, border: '1px solid #1976d2' }}>
                <input
                  type="text"
                  placeholder="ID"
                  value={p_id}
                  onChange={e => setp_id(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1.5px solid #1976d2',
                    borderRadius: 4,
                    background: '#f4f8fb',
                    fontSize: 16,
                    outline: 'none',
                    marginTop: 2,
                    marginBottom: 2,
                  }}
                />
              </td>
            </tr>
            <tr>
              <td style={{ backgroundColor: '#1976d2', color: 'white', width: 90, textAlign: 'center', padding: 10, border: '1px solid #1976d2' }}>Password</td>
              <td style={{ padding: 10, border: '1px solid #1976d2', position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1.5px solid #1976d2',
                    borderRadius: 4,
                    background: '#f4f8fb',
                    fontSize: 16,
                    outline: 'none',
                    marginTop: 2,
                    marginBottom: 2,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <button
          type="submit"
          style={{
            padding: 10,
            width: '100%',
            marginTop: 16,
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(25, 118, 210, 0.08)',
            opacity: loading ? 0.7 : 1,
          }}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      </form>
    </div>
  );
};

export default Login;
