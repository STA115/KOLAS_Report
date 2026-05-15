import React, { useState } from 'react';

interface LoginProps {
  onLogin: (id?: string) => void;
}

const LOGIN_REQUEST_TIMEOUT_MS = 10000;

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [p_id, setp_id] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = (import.meta as any).env.DEV
    ? ''
    : (((import.meta as any).env.VITE_API_BASE_URL || '') as string).replace(/\/$/, '');
  const APP_BASE_PATH = (((import.meta as any).env.BASE_URL || '/') as string).replace(/\/$/, '');

  const getLoginUrlCandidates = () => {
    const { protocol, hostname, origin, port } = window.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isLikelyDevFrontend = port === '5173' || port === '4173' || port === '3000';
    const canTryLocalBackend = isLocalHost || isLikelyDevFrontend || protocol === 'http:';

    const urls = [
      API_BASE_URL ? `${API_BASE_URL}/login` : '',
      canTryLocalBackend ? `${protocol}//${hostname}:8080/login` : '',
      `${origin}/login`,
      APP_BASE_PATH ? `${origin}${APP_BASE_PATH}/login` : '',
      '/login',
      APP_BASE_PATH ? `${APP_BASE_PATH}/login` : '',
    ].filter(Boolean);

    return Array.from(new Set(urls));
  };

  const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = LOGIN_REQUEST_TIMEOUT_MS) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p_id || !password) {
      setError('아이디와 비밀번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const loginUrls = getLoginUrlCandidates();
      let data: any = {};
      let lastError: Error | null = null;
      let loginSuccess = false;

      for (const loginUrl of loginUrls) {
        try {
          const response = await fetchWithTimeout(loginUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
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
            if (response.status === 404) {
              lastError = new Error(`[404] ${serverMessage}`);
              continue;
            }
            throw new Error(`[${response.status}] ${serverMessage}`);
          }

          loginSuccess = !!data?.success;
          if (!loginSuccess) {
            const failMessage = data?.error || data?.message || data?.rawText || '로그인에 실패했습니다.';
            setError(failMessage);
            alert(`로그인 실패: ${failMessage}`);
            return;
          }

          break;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          lastError = new Error(`${loginUrl} -> ${error.message}`);
        }
      }

      if (!loginSuccess) {
        const isGitHubPages = window.location.hostname.endsWith('github.io');
        if (!API_BASE_URL && isGitHubPages) {
          throw new Error('GitHub Pages는 정적 호스팅입니다. VITE_API_BASE_URL에 백엔드 서버 주소를 설정해 주세요.');
        }
        throw lastError || new Error('로그인 요청에 실패했습니다.');
      }

      if (data?.success) {
        const expire = Date.now() + 60 * 60 * 1000;
        localStorage.setItem('session_expire', expire.toString());
        localStorage.setItem('member', JSON.stringify(data.member));
        if (data?.member?.id) {
          localStorage.setItem('login_id', data.member.id);
        }
        alert('로그인되었습니다!');
        onLogin(data?.member?.id);
      } else {
        const failMessage = data?.error || data?.message || data?.rawText || '로그인에 실패했습니다.';
        setError(failMessage);
        alert(`로그인 실패: ${failMessage}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(`서버 연결 오류: ${errorMsg}`);
      alert(`서버 연결 실패\n\n오류 상세:\n${errorMsg}`);
      console.error('Login error:', err);
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
                    marginBottom: 2
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
