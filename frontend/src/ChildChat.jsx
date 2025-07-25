import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ChildChat({ token, child, user }) {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [selectedTopic, setSelectedTopic] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredSession, setHoveredSession] = useState(null);
  const chatEndRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // fetch all chat sessions and the current session/messages on mount or sessionId change
  useEffect(() => {
    fetchAllSessions();
    if (sessionId) {
      fetchSessionAndMessages(sessionId);
    }
  }, [sessionId, child]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchAllSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/chat-session/${child.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setChatSessions(data.sessions || []);
      }
    } catch (err) {
      // ignore error for sidebar
    }
  };

  const fetchSessionAndMessages = async (sessionId) => {
    setIsLoading(true);
    try {
      // fetch session info (topics)
      const sessionRes = await fetch(`${API_URL}/chat-session/${child.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sessionData = await sessionRes.json();
      if (sessionRes.ok && sessionData.sessions) {
        const session = sessionData.sessions.find(s => s.id === sessionId);
        if (session) setSelectedTopic(session.topic);
      }
      // fetch messages
      const response = await fetch(`${API_URL}/chat-message/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.messages.map(msg => {
          let buttons = [];
          if (msg.buttons_offered) {
            if (Array.isArray(msg.buttons_offered)) {
              buttons = msg.buttons_offered;
            } else if (typeof msg.buttons_offered === 'string') {
              try { buttons = JSON.parse(msg.buttons_offered); } catch { buttons = []; }
            }
          }
          return {
            id: msg.id,
            content: msg.message_text,
            sender: msg.from_type,
            buttons,
            timestamp: msg.created_at
          };
        });
        setMessages(formattedMessages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      setError('Failed to load chat session');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;
    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    const newUserMessage = {
      id: Date.now(),
      content: userMessage,
      sender: 'kid',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);
    try {
      const aiResponse = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMessage, topic: selectedTopic })
      });
      const aiData = await aiResponse.json();
      if (aiResponse.ok) {
        const newAiMessage = {
          id: Date.now() + 1,
          content: aiData.response,
          buttons: aiData.buttons || [],
          sender: 'ai',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, newAiMessage]);
        await fetch(`${API_URL}/chat-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ session_id: sessionId, from_type: 'kid', message_text: userMessage, buttons_offered: null })
        });
        await fetch(`${API_URL}/chat-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ session_id: sessionId, from_type: 'ai', message_text: aiData.response, buttons_offered: aiData.buttons || null })
        });
      } else {
        setError('Failed to get AI response');
      }
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = (buttonText) => setInputMessage(buttonText);
  const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const handleLogout = async () => { 
    // track usage before logout
    try {
      const response = await fetch(`${API_URL}/child-logout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Usage tracking failed:', result.error);
      }
    } catch (err) {
      console.error('Failed to track logout usage:', err);
    }
    
    localStorage.removeItem('user'); 
    navigate('/login'); 
  };
  const goBackToMain = () => { navigate('/child-main'); };

  return (
    <div style={{ minHeight: '100vh', height: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Brand/logo bar */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 40px 0 40px', boxSizing: 'border-box', flex: '0 0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#2d3a4a', letterSpacing: 1, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '2.2rem', marginRight: 8 }}></span> Kids AI Chat
          </span>
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
        >
          Logout
        </button>
      </div>
      {/* main chat layout */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', height: 'calc(100vh - 80px)' }}>
        {/* side bar layout */}
        <div style={{ width: 260, background: '#f4f7fa', borderRight: '1.5px solid #e3e3e3', boxShadow: '2px 0 8px #e3e3e3', display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '0 0 0 0', minWidth: 140, maxWidth: 320 }}>
          <div style={{ fontSize: '1.3rem', color: '#2d3a4a', fontWeight: 'bold', textAlign: 'center', margin: '32px 0 18px 0' }}>Chat History</div>
          <button onClick={goBackToMain} style={{ margin: '0 18px 18px 18px', padding: '14px 0', borderRadius: 14, background: 'linear-gradient(90deg, #fffbe7 0%, #ffe9b2 100%)', color: '#2d3a4a', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px #e3e3e3', transition: 'background 0.2s', marginBottom: 24 }}>← Back to Topics</button>
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
            {chatSessions.length === 0 ? (
              <div style={{ color: '#b0b0b0', textAlign: 'center', margin: '24px 0' }}>No previous chats</div>
            ) : (
              chatSessions.map((session, idx) => (
                <div
                  key={session.id}
                  onClick={() => navigate(`/child-chat/${session.id}`)}
                  onMouseEnter={() => setHoveredSession(idx)}
                  onMouseLeave={() => setHoveredSession(null)}
                  style={{
                    fontSize: '1.1rem',
                    padding: '16px',
                    margin: '0 12px 12px 12px',
                    borderRadius: 16,
                    background: session.id === sessionId
                      ? 'linear-gradient(90deg, #e3f0ff 0%, #b6e0fe 100%)'
                      : hoveredSession === idx
                        ? 'linear-gradient(90deg, #ffe066 0%, #fffbe7 100%)'
                        : '#fff',
                    color: '#2d3a4a',
                    cursor: 'pointer',
                    fontWeight: session.id === sessionId ? 700 : 500,
                    border: session.id === sessionId ? '2px solid #b6e0fe' : '1.5px solid #e3e3e3',
                    boxShadow: '0 2px 8px #e3e3e3',
                    transition: 'background 0.2s, border 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{session.topic}</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>{new Date(session.started_at).toLocaleDateString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* main chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 0, boxShadow: 'none', border: 'none', minWidth: 0, position: 'relative', height: '100%' }}>
          <div style={{ fontSize: '1.7rem', color: '#2d3a4a', fontWeight: 700, textAlign: 'center', margin: '32px 0 0 0', minHeight: 48 }}>{selectedTopic}</div>
          {/* message page */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 0 12px 0', margin: '0 0 0 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map((message) => (
              <div key={message.id} style={{ display: 'flex', justifyContent: message.sender === 'kid' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  background: message.sender === 'kid'
                    ? 'linear-gradient(90deg, #e3f0ff 0%, #b6e0fe 100%)'
                    : 'linear-gradient(90deg, #fffbe7 0%, #ffe9b2 100%)',
                  color: '#2d3a4a',
                  border: message.sender === 'kid' ? '1.5px solid #b6e0fe' : '1.5px solid #ffe9b2',
                  boxShadow: '0 2px 8px #e3e3e3',
                  borderRadius: message.sender === 'kid' ? '22px 22px 6px 22px' : '22px 22px 22px 6px',
                  padding: '16px 24px',
                  marginBottom: 12,
                  maxWidth: '70%',
                  fontSize: '1.15rem',
                  textAlign: message.sender === 'kid' ? 'right' : 'left',
                  alignSelf: message.sender === 'kid' ? 'flex-end' : 'flex-start',
                  wordBreak: 'break-word',
                }}>
                  {message.content}
                  {message.buttons && message.buttons.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start', marginTop: 10 }}>
                      {message.buttons.map((button, index) => (
                        <button
                          key={index}
                          style={{
                            background: 'linear-gradient(90deg, #fffbe7 0%, #ffe9b2 100%)',
                            color: '#2d3a4a',
                            border: '1.5px solid #ffe9b2',
                            fontWeight: 'bold',
                            borderRadius: 12,
                            boxShadow: '0 2px 8px #e3e3e3',
                            fontSize: '1rem',
                            padding: '10px 18px',
                            marginTop: 4,
                            cursor: 'pointer',
                          }}
                          onClick={() => handleButtonClick(button)}
                        >
                          {button}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          {/* user input area */}
          <div style={{ flex: '0 0 auto', width: '100%', boxShadow: '0 -2px 12px #e3e3e3', background: '#f4f7fa', padding: '18px 18px 24px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button disabled={isLoading} style={{ fontSize: '2.2rem', background: '#e3f0ff', border: '2.5px solid #b6e0fe', borderRadius: '50%', width: 60, height: 60, cursor: 'pointer', transition: 'background 0.2s, transform 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d3a4a' }}>🎤</button>
            <input
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              style={{ flex: 1, fontSize: '1.2rem', padding: 16, borderRadius: 16, border: '1.5px solid #b6e0fe', outline: 'none', background: '#fff', minWidth: 0, color: '#2d3a4a' }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              style={{ fontSize: '1.2rem', background: 'linear-gradient(90deg, #b6e0fe 0%, #e3f0ff 100%)', color: '#2d3a4a', border: 'none', borderRadius: 16, padding: '16px 28px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s, transform 0.1s', minWidth: 80, boxShadow: '0 2px 8px #e3e3e3' }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
      {error && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#e57373', color: 'white', padding: '12px 24px', borderRadius: 8, zIndex: 1000, boxShadow: '0 2px 8px #e3e3e3' }}>{error}</div>
      )}
    </div>
  );
} 