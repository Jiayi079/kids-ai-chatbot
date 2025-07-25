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
    <form onSubmit={handleSubmit}>
      <div>
        <button type="button" onClick={() => setMode('parent')} disabled={mode === 'parent'}>Parent Login</button>
        <button type="button" onClick={() => setMode('child')} disabled={mode === 'child'}>Child Login</button>
      </div>
      {mode === 'parent' ? (
        <>
          <input placeholder="Parent Email" value={email} onChange={e => setEmail(e.target.value)} required />
        </>
      ) : (
        <>
          <input placeholder="Child Username" value={username} onChange={e => setUsername(e.target.value)} required />
        </>
      )}
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit">Login</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
}
