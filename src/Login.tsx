import React, { useState } from 'react';
import {
  clearRuntimeApiBaseUrl,
  isGithubPagesHost,
  resolveConfiguredApiBaseUrl,
  setRuntimeApiBaseUrl,
} from './utils/apiBase';

interface LoginProps {
  onLogin: (id?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [p_id, setp_id] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiBaseInput, setApiBaseInput] = useState(resolveConfiguredApiBaseUrl());
  const [apiBaseNotice, setApiBaseNotice] = useState('');
  const isDev = Boolean((import.meta as any).env?.DEV);
  const isGithubPages = isGithubPagesHost();

  const saveSession = (member: { id?: string; email?: string; admin_flag?: string }) => {
    const expire = Date.now() + 60 * 60 * 1000;
    localStorage.setItem('session_expire', expire.toString());
    localStorage.setItem('member', JSON.stringify(member));
    if (member?.id) {
      localStorage.setItem('login_id', member.id);
    }
  };

  const getLoginUrlCandidates = () => {
    const apiBase = resolveConfiguredApiBaseUrl();
    const urls = apiBase
      ? [`${apiBase}/api/auth/login`, `${apiBase}/login`]
      : isDev
        ? ['/api/auth/login', '/login']
        : isGithubPages
          ? []
          : ['/api/auth/login', '/login'];

    return Array.from(new Set(urls));
  };

  const handleApiLogin = async () => {
    const loginUrls = getLoginUrlCandidates();
    if (loginUrls.length === 0) {
      throw new Error(
        '백엔드 URL이 비어 있습니다. 로그인창의 Backend URL에 https://<백엔드도메인> 입력 후 저장해 주세요.',
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

  const handleSaveApiBase = () => {
    try {
      const saved = setRuntimeApiBaseUrl(apiBaseInput);
      if (!saved) {
        setApiBaseNotice('유효한 URL을 입력하세요. 예: https://your-backend.onrender.com');
        return;
      }
      setApiBaseInput(saved);
      setApiBaseNotice(`저장 완료: ${saved}`);
      setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setApiBaseNotice(`저장 실패: ${message}`);
    }
  };

  const handleClearApiBase = () => {
    clearRuntimeApiBaseUrl();
    setApiBaseInput('');
    setApiBaseNotice('저장된 Backend URL을 삭제했습니다.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 32, color: '#1976d2', letterSpacing: 2, textAlign: 'center' }}>KOLAS</div>
      <form onSubmit={handleSubmit} style={{ width: 320 }}>
        {isGithubPages && (
          <div style={{ marginBottom: 12, border: '1px solid #90caf9', borderRadius: 6, padding: 10, background: '#f3f9ff' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#0d47a1' }}>Backend URL</div>
            <input
              type="text"
              placeholder="https://your-backend-domain"
              value={apiBaseInput}
              onChange={e => setApiBaseInput(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                border: '1.5px solid #1976d2',
                borderRadius: 4,
                background: 'white',
                fontSize: 14,
                outline: 'none',
                marginBottom: 8,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleSaveApiBase}
                style={{
                  padding: '6px 10px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Save URL
              </button>
              <button
                type="button"
                onClick={handleClearApiBase}
                style={{
                  padding: '6px 10px',
                  backgroundColor: '#e3f2fd',
                  color: '#0d47a1',
                  border: '1px solid #90caf9',
                  borderRadius: 4,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>
            {apiBaseNotice && <div style={{ marginTop: 6, fontSize: 12, color: '#0d47a1' }}>{apiBaseNotice}</div>}
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
