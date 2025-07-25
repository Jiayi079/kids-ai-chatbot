import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('parent');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let url, body;
      if (mode === 'parent') {
        url = `${API_URL}/parent-login`;
        body = { email, password };
      } else {
        url = `${API_URL}/child-login`;
        body = { username, password };
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      // save to localStorage for persistent login
      localStorage.setItem('user', JSON.stringify(data));
      onLogin(data, mode);
      if (mode === 'parent') {
        navigate('/parent-dashboard');
      } else {
        navigate('/child-chat');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '24px 40px 0 40px', boxSizing: 'border-box', flex: '0 0 auto' }}>
        <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#2d3a4a', letterSpacing: 1, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '2.2rem', marginRight: 8 }}></span> Kids AI Chat
        </span>
      </div>
      {/* login form layout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <div style={{ width: 480, maxWidth: '98vw', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 36, marginBottom: 48, marginTop: 18, width: '100%', justifyContent: 'center' }}>
            <button
              type="button"
              style={{
                flex: 1,
                background: mode === 'parent' ? 'linear-gradient(90deg, #e3f0ff 0%, #b6e0fe 100%)' : '#fff',
                color: '#2d3a4a',
                minWidth: 180,
                minHeight: 70,
                border: mode === 'parent' ? '2.5px solid #b6e0fe' : '2.5px solid #e3e3e3',
                fontWeight: mode === 'parent' ? 'bold' : 'normal',
                fontSize: '2rem',
                borderRadius: 16,
                padding: '18px 0',
                cursor: mode === 'parent' ? 'default' : 'pointer',
                transition: 'background 0.2s',
                boxShadow: '0 2px 8px #e3e3e3',
              }}
              onClick={() => setMode('parent')}
              disabled={mode === 'parent'}
            > Parent </button>
            <button
              type="button"
              style={{
                flex: 1,
                background: mode === 'child' ? 'linear-gradient(90deg, #fffbe7 0%, #ffe9b2 100%)' : '#fff',
                color: '#2d3a4a',
                minWidth: 180,
                minHeight: 70,
                border: mode === 'child' ? '2.5px solid #ffe9b2' : '2.5px solid #e3e3e3',
                fontWeight: mode === 'child' ? 'bold' : 'normal',
                fontSize: '2rem',
                borderRadius: 16,
                padding: '18px 0',
                cursor: mode === 'child' ? 'default' : 'pointer',
                transition: 'background 0.2s',
                boxShadow: '0 2px 8px #e3e3e3',
              }}
              onClick={() => setMode('child')}
              disabled={mode === 'child'}
            > Child </button>
          </div>
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
              width: '100%',
              background: '#fff',
              borderRadius: 28,
              boxShadow: '0 4px 24px #e3e3e3',
              padding: '48px 38px 36px 38px',
              marginBottom: 32,
              border: '2.5px solid #e3e3e3',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '2.2rem', color: '#2d3a4a', fontWeight: 800, marginBottom: 12, textAlign: 'center', display: 'flex', alignItems: 'center', gap: 10 }}>
              {mode === 'parent' ? <span style={{ fontSize: '2.2rem' }}>👨‍👩‍👧</span> : <span style={{ fontSize: '2.2rem' }}>🧒</span>}
              {mode === 'parent' ? 'Parent Login' : 'Child Login'}
            </span>
            {mode === 'parent' ? (
              <input
                style={{ fontSize: '1.5rem', padding: '22px', borderRadius: 16, border: '2px solid #b6e0fe', color: '#2d3a4a', marginBottom: 0, width: '100%' }}
                placeholder="Parent Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            ) : (
              <input
                style={{ fontSize: '1.5rem', padding: '22px', borderRadius: 16, border: '2px solid #ffe9b2', color: '#2d3a4a', marginBottom: 0, width: '100%' }}
                placeholder="Child Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            )}
            <input
              type="password"
              style={{ fontSize: '1.5rem', padding: '22px', borderRadius: 16, border: '2px solid #e3e3e3', color: '#2d3a4a', marginBottom: 0, width: '100%' }}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              style={{
                fontSize: '1.5rem',
                padding: '22px',
                borderRadius: 16,
                marginTop: 8,
                background: 'linear-gradient(90deg, #b6e0fe 0%, #e3f0ff 100%)',
                color: '#2d3a4a',
                fontWeight: 'bold',
                border: 'none',
                boxShadow: '0 2px 8px #e3e3e3',
                width: '100%',
              }}
            >
              Login
            </button>
            {error && <div style={{ color: '#e57373', marginTop: 8, fontSize: '1.1rem' }}>{error}</div>}
          </form>
          <button
            type="button"
            style={{
              background: 'linear-gradient(90deg, #fffbe7 0%, #ffe9b2 100%)',
              color: '#2d3a4a',
              fontWeight: 'bold',
              border: '2px solid #ffe9b2',
              marginTop: 0,
              fontSize: '1.3rem',
              padding: '22px 0',
              width: '100%',
              borderRadius: 18,
              boxShadow: '0 2px 8px #e3e3e3',
            }}
            onClick={() => navigate('/register')}
          >
            New parent? Register here
          </button>
        </div>
      </div>
    </div>
  );
}
