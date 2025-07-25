import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ParentRegister({ onRegister }) {
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
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      // registration successful --> redirect to login
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '24px 40px 0 40px', boxSizing: 'border-box', flex: '0 0 auto' }}>
        <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#2d3a4a', letterSpacing: 1, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '2.2rem', marginRight: 8 }}></span> Kids AI Chat </span>
      </div>
      {/* register form layout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <div style={{ width: 480, maxWidth: '98vw', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
              <span style={{ fontSize: '2.2rem' }}></span> Parent Registration </span>
            <input
              style={{ fontSize: '1.5rem', padding: '22px', borderRadius: 16, border: '2px solid #b6e0fe', color: '#2d3a4a', marginBottom: 0, width: '100%' }}
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              style={{ fontSize: '1.5rem', padding: '22px', borderRadius: 16, border: '2px solid #ffe9b2', color: '#2d3a4a', marginBottom: 0, width: '100%' }}
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
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
              Register
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
            onClick={() => navigate('/login')}
          >
            Already have an account? Login here
          </button>
        </div>
      </div>
    </div>
  );
}