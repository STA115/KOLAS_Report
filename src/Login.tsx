import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface LoginProps {
  onLogin: (id?: string) => void;
}

const supabaseUrl = ((import.meta as any).env.VITE_SUPABASE_URL || '') as string;
const supabaseAnonKey = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY || '') as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type MemberRow = Record<string, unknown>;

const findMemberById = async (loginId: string): Promise<{ row: MemberRow; idColumn: string; pwdColumn: string } | null> => {
  const candidates = [
    { idColumn: 'id', pwdColumn: 'pwd' },
    { idColumn: 'Id', pwdColumn: 'pwd' },
    { idColumn: 'id', pwdColumn: 'Pwd' },
    { idColumn: 'Id', pwdColumn: 'Pwd' }
  ];

  let lastError: Error | null = null;

  for (const candidate of candidates) {
    const { idColumn, pwdColumn } = candidate;
    const selectColumns = `${idColumn},${pwdColumn}`;
    const { data, error } = await supabase
      .from('member')
      .select(selectColumns)
      .eq(idColumn, loginId)
      .limit(1);

    if (error) {
      lastError = error;
      continue;
    }

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    return { row: data[0] as unknown as MemberRow, idColumn, pwdColumn };
  }

  if (lastError) {
    throw lastError;
  }

  return null;
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

    if (!supabaseUrl || !supabaseAnonKey) {
      setError('Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)를 확인해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const member = await findMemberById(id);

      if (!member) {
        setError('아이디 또는 비밀번호가 일치하지 않습니다.');
        return;
      }

      const savedPassword = String(member.row[member.pwdColumn] ?? '');
      if (savedPassword !== password) {
        setError('아이디 또는 비밀번호가 일치하지 않습니다.');
        return;
      }

      const memberId = String(member.row[member.idColumn] ?? id);
      onLogin(memberId);
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(`로그인 중 오류가 발생했습니다: ${message}`);
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
