import React, { useState } from 'react';

interface LoginProps {
  onLogin: (id?: string) => void;
}

const API_BASE_URL = (((import.meta as any).env.VITE_API_BASE_URL || '') as string).replace(/\/$/, '');
const LEGACY_BASE_PATH = '/KOLAS_REPORT';

const buildLoginUrls = () => {
  const { protocol, hostname, origin } = window.location;
  const urls = [
    API_BASE_URL ? `${API_BASE_URL}/login` : '',
    `${LEGACY_BASE_PATH}/login`,
    '/login',
    `${origin}/login`,
    `${origin}${LEGACY_BASE_PATH}/login`,
    `${protocol}//${hostname}:8080/login`
  ].filter(Boolean);

  return Array.from(new Set(urls));
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !password) {
      setError('아이디와 비밀번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const urls = buildLoginUrls();
      let lastError: Error | null = null;

      for (const url of urls) {
        try {
          const response = await fetch(url, {
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
            if (response.status === 404) {
              lastError = new Error(`[404] ${message}`);
              continue;
            }
            throw new Error(`[${response.status}] ${message}`);
          }

          if (payload?.success) {
            onLogin(payload?.member?.id || id);
            return;
          }

          throw new Error(payload?.error || payload?.message || '로그인에 실패했습니다.');
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }

      throw lastError || new Error('로그인 서버를 찾을 수 없습니다.');
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
        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      </form>
    </div>
  );
};

export default Login;
