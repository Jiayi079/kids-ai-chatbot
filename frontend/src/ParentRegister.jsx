import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ParentRegister({ onRegister }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRulesModal, setShowRulesModal] = useState(false);
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
            
            {/* Rules Button */}
            <button
              type="button"
              onClick={() => setShowRulesModal(true)}
              style={{
                background: 'linear-gradient(135deg, #e3f0ff 0%, #b6e0fe 100%)',
                color: '#2d3a4a',
                fontWeight: 600,
                border: '2px solid #b6e0fe',
                borderRadius: 12,
                padding: '12px 20px',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
                boxShadow: '0 2px 8px #e3e3e3',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #b6e0fe 0%, #8cc8fe 100%)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #e3f0ff 0%, #b6e0fe 100%)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>📋</span>
              Read App Rules & Information
            </button>
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

      {/* Rules Modal Popup */}
      {showRulesModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowRulesModal(false)}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              border: '2px solid #e3e3e3'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '24px',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '16px'
            }}>
              <h2 style={{ 
                fontSize: '1.8rem', 
                color: '#2d3a4a', 
                fontWeight: 700,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <span style={{ fontSize: '2rem' }}>📋</span>
                About Our Kids AI Chat App
              </h2>
              <button
                onClick={() => setShowRulesModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ fontSize: '1rem', color: '#4a5568', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  color: '#2d3a4a', 
                  fontWeight: 600, 
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span>🎯</span> What We Offer
                </h3>
                <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                  <li>Safe, age-appropriate AI conversations for children 6-12 years old</li>
                  <li>Educational topics: Math, Science, Stories, Art, and more</li>
                  <li>Parent dashboard to monitor usage and chat history</li>
                  <li>Daily usage limits to ensure healthy screen time</li>
                </ul>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  color: '#2d3a4a', 
                  fontWeight: 600, 
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span>🛡️</span> Safety & Values
                </h3>
                <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                  <li>All AI responses are filtered for age-appropriate content</li>
                  <li>Promotes good values: kindness, honesty, respect, and empathy</li>
                  <li>Encourages curiosity and creativity in learning</li>
                  <li>No harmful, scary, or inappropriate content</li>
                </ul>
              </div>
              
              <div style={{ 
                background: '#fff3cd', 
                border: '1px solid #ffeaa7', 
                borderRadius: 12, 
                padding: '16px', 
                marginTop: '20px',
                fontSize: '0.95rem'
              }}>
                <strong style={{ color: '#856404' }}>⚠️ Important:</strong> By registering, you agree to supervise your child's use of this app and ensure they follow appropriate online safety practices.
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ 
              marginTop: '24px', 
              paddingTop: '16px', 
              borderTop: '2px solid #f0f0f0',
              textAlign: 'center'
            }}>
              <button
                onClick={() => setShowRulesModal(false)}
                style={{
                  background: 'linear-gradient(135deg, #b6e0fe 0%, #8cc8fe 100%)',
                  color: '#2d3a4a',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 24px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px #e3e3e3',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #8cc8fe 0%, #6bb6fe 100%)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #b6e0fe 0%, #8cc8fe 100%)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}