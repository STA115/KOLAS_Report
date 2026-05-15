import React, { useState } from 'react';

interface LoginProps {
  onLogin: (id?: string) => void;
}

const API_BASE_URL = (import.meta as any).env.DEV
  ? ''
  : (((import.meta as any).env.VITE_API_BASE_URL || '') as string).replace(/\/$/, '');

const getApiBaseUrl = () => {
  if (API_BASE_URL) return API_BASE_URL;

  const { protocol, hostname, port } = window.location;
  const isLocalFrontend = hostname === 'localhost' || hostname === '127.0.0.1';
  const isLikelyDevFrontend = port === '5173' || port === '4173' || port === '3000';

  if (isLocalFrontend || isLikelyDevFrontend || protocol === 'http:') {
    return `${protocol}//${hostname}:8080`;
  }

  return '';
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const moveToServerLoginPage = () => {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      setError('백엔드 URL이 설정되지 않았습니다. VITE_API_BASE_URL을 설정해 주세요.');
      return;
    }
    const next = encodeURIComponent(window.location.href);
    window.location.href = `${apiBaseUrl}/login-page?next=${next}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !password) {
      setError('아이디와 비밀번호를 입력해 주세요.');
      return;
    }

    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      setError('백엔드 URL이 설정되지 않았습니다. VITE_API_BASE_URL을 설정해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, pwd: password })
      });

      const text = await response.text();
      let payload: any = {};

      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = { rawText: text };
        }
      }

      if (!response.ok) {
        const message = payload?.error || payload?.message || payload?.rawText || `${response.status} ${response.statusText}`;
        throw new Error(message);
      }

      if (!payload?.success) {
        throw new Error(payload?.error || payload?.message || '로그인에 실패했습니다.');
      }

      onLogin(payload?.member?.id || id);
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(`로그인 실패: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 32, color: '#1976d2', letterSpacing: 2, textAlign: 'center' }}>KOLAS</div>
      <form onSubmit={handleSubmit} style={{ width: 320 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #1976d2' }}>
          <tbody>
            <tr>
              <td style={{ backgroundColor: '#1976d2', color: 'white', width: 90, textAlign: 'center', padding: 10, border: '1px solid #1976d2' }}>아이디</td>
              <td style={{ padding: 10, border: '1px solid #1976d2' }}>
                <input
                  type="text"
                  placeholder="아이디"
                  value={id}
                  onChange={(event) => setId(event.target.value)}
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1.5px solid #1976d2',
                    borderRadius: 4,
                    background: '#f4f8fb',
                    fontSize: 16,
                    outline: 'none',
                    marginTop: 2,
                    marginBottom: 2
                  }}
                />
              </td>
            </tr>
            <tr>
              <td style={{ backgroundColor: '#1976d2', color: 'white', width: 90, textAlign: 'center', padding: 10, border: '1px solid #1976d2' }}>비밀번호</td>
              <td style={{ padding: 10, border: '1px solid #1976d2', position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1.5px solid #1976d2',
                    borderRadius: 4,
                    background: '#f4f8fb',
                    fontSize: 16,
                    outline: 'none',
                    marginTop: 2,
                    marginBottom: 2
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPassword ? '숨김' : '보기'}
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
            opacity: loading ? 0.7 : 1
          }}
          disabled={loading}
        >
          {loading ? '확인 중...' : '로그인'}
        </button>
        <button
          type="button"
          onClick={moveToServerLoginPage}
          style={{
            padding: 10,
            width: '100%',
            marginTop: 8,
            backgroundColor: 'white',
            color: '#1976d2',
            border: '1px solid #1976d2',
            borderRadius: 6,
            fontSize: 14,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          서버 로그인 페이지로 이동
        </button>
        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      </form>
    </div>
  );
};

export default Login;
