import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChildMain({ token, child }) {
  const navigate = useNavigate();
  const [chatSessions, setChatSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredTopic, setHoveredTopic] = useState(null);
  const [hoveredSession, setHoveredSession] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const topics = [
    'Math Fun', 'Science Stories', 'Animal Friends',
    'Space Adventure', 'Ocean World', 'Dinosaur Time',
    'Magic Stories', 'Art & Colors', 'Music & Songs',
    'Nature Explorer', 'Robot Friends', 'Fairy Tales'
  ];

  useEffect(() => {
    fetchChatSessions();
  }, []);

  const fetchChatSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/chat-session/${child.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setChatSessions(data.sessions || []);
      } else {
        setError('Failed to load chat history');
      }
    } catch (err) {
      setError('Failed to load chat history');
    }
  };

  const handleTopicClick = async (topic) => {
    setIsLoading(true);
    setError('');
    // create a new chat session, then navigate to chat page
    try {
      const response = await fetch(`${API_URL}/chat-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ child_id: child.id, topic })
      });
      const data = await response.json();
      if (response.ok) {
        navigate(`/child-chat/${data.session.id}`);
      } else {
        setError('Failed to start new chat');
      }
    } catch (err) {
      setError('Failed to start new chat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionClick = (session) => {
    navigate(`/child-chat/${session.id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 40px 0 40px', boxSizing: 'border-box', flex: '0 0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#2d3a4a', letterSpacing: 1, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '2.2rem', marginRight: 8 }}></span> Kids AI Chat </span>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            padding: '8px 18px',
            backgroundColor: '#e57373',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px #e3e3e3',
          }}
        > Logout </button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', minHeight: '70vh', marginTop: 30 }}>
        <div style={{ margin: '40px 0 24px 0', textAlign: 'center' }}>
          <span style={{ fontSize: '2.7rem', color: '#2d3a4a', fontWeight: 900, letterSpacing: 1, display: 'block', marginBottom: 0 }}>
            👋 Hello {child.name}!
          </span>
        </div>
        <p style={{ fontSize: '1.3rem', color: '#2d3a4a', marginBottom: '32px', textAlign: 'center', fontWeight: 500 }}>
          What would you like to learn about today?
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 32,
            justifyContent: 'center',
            alignItems: 'center',
            maxWidth: 1100,
            margin: '0 auto',
            marginBottom: 40,
          }}
        >
          {topics.map((topic, index) => (
            <button
              key={index}
              onClick={() => handleTopicClick(topic)}
              onMouseEnter={() => setHoveredTopic(index)}
              onMouseLeave={() => setHoveredTopic(null)}
              disabled={isLoading}
              style={{
                fontSize: '1.4rem',
                padding: '28px 38px',
                border: 'none',
                borderRadius: 28,
                background: hoveredTopic === index
                  ? 'linear-gradient(90deg, #ffe066 0%, #fffbe7 100%)'
                  : 'linear-gradient(90deg, #e3f0ff 0%, #b6e0fe 100%)',
                color: '#2d3a4a',
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px #e3e3e3',
                minWidth: 180,
                minHeight: 80,
                transition: 'background 0.2s, transform 0.1s',
                transform: hoveredTopic === index ? 'scale(1.04)' : 'scale(1)',
                outline: hoveredTopic === index ? '2.5px solid #ffe066' : 'none',
              }}
            >
              {topic}
            </button>
          ))}
        </div>
        {chatSessions.length > 0 && (
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <h3 style={{ color: '#2d3a4a', marginBottom: '16px', fontWeight: 600 }}>Recent Chats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              {chatSessions.slice(0, 3).map((session, idx) => (
                <button
                  key={session.id}
                  onClick={() => handleSessionClick(session)}
                  onMouseEnter={() => setHoveredSession(idx)}
                  onMouseLeave={() => setHoveredSession(null)}
                  style={{
                    padding: '10px 22px',
                    border: '1.5px solid #b6e0fe',
                    borderRadius: '12px',
                    background: hoveredSession === idx ? 'linear-gradient(90deg, #ffe066 0%, #fffbe7 100%)' : '#fff',
                    color: '#2d3a4a',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    boxShadow: '0 2px 8px #e3e3e3',
                    fontWeight: 500,
                    transition: 'background 0.2s',
                  }}
                >
                  {session.topic} - {new Date(session.started_at).toLocaleDateString()}
                </button>
              ))}
            </div>
          </div>
        )}
        {error && <div style={{ color: '#e57373', marginTop: '16px' }}>{error}</div>}
      </div>
    </div>
  );
} 