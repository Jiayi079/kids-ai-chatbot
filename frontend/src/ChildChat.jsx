import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

export default function ChildChat({ token, child }) {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('welcome');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL;

  // Fun topics for kids
  const topics = [
    'Math Fun', 'Science Stories', 'Animal Friends', 
    'Space Adventure', 'Ocean World', 'Dinosaur Time',
    'Magic Stories', 'Art & Colors', 'Music & Songs',
    'Nature Explorer', 'Robot Friends', 'Fairy Tales'
  ];

  // Fetch chat sessions when component mounts
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

  const startNewChat = async (topic) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/chat-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          child_id: child.id,
          topic: topic
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setCurrentSession(data.session);
        setSelectedTopic(topic);
        setCurrentView('chat');
        setMessages([]);
        setChatSessions(prev => [data.session, ...prev]);
      } else {
        setError('Failed to start new chat');
      }
    } catch (err) {
      setError('Failed to start new chat');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    
    // add user message to chat
    const newUserMessage = {
      id: Date.now(),
      content: userMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // send to AI and get response
      const aiResponse = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          topic: selectedTopic
        })
      });

      const aiData = await aiResponse.json();
      
      if (aiResponse.ok) {
        // Add AI response to chat
        const newAiMessage = {
          id: Date.now() + 1,
          content: aiData.response,
          buttons: aiData.buttons || [],
          sender: 'ai',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, newAiMessage]);

        // store user message to db
        await fetch(`${API_URL}/chat-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            session_id: currentSession.id,
            from_type: 'kid',
            message_text: userMessage,
            buttons_offered: null
          })
        });

        // store AI response message to db
        await fetch(`${API_URL}/chat-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            session_id: currentSession.id,
            from_type: 'ai',
            message_text: aiData.response,
            buttons_offered: aiData.buttons || null
          })
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

  const handleButtonClick = (buttonText) => {
    setInputMessage(buttonText);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const loadChatSession = async (session) => {
    setCurrentSession(session);
    setSelectedTopic(session.topic);
    setCurrentView('chat');
    setMessages([]);
    setIsLoading(true);
    
    try {
      // get messages for this session
      const response = await fetch(`${API_URL}/chat-message/${session.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received data:', data);
        const formattedMessages = data.messages.map(msg => {
          // handle buttons_offered - it could be an array, JSON string, or null
          let buttons = [];
          if (msg.buttons_offered) {
            if (Array.isArray(msg.buttons_offered)) {
              buttons = msg.buttons_offered;
            } else if (typeof msg.buttons_offered === 'string') {
              try {
                buttons = JSON.parse(msg.buttons_offered);
              } catch (e) {
                console.error('Failed to parse buttons_offered:', e);
                buttons = [];
              }
            }
          }
          
          return {
            id: msg.id,
            content: msg.message_text,
            sender: msg.from_type,
            buttons: buttons,
            timestamp: msg.created_at
          };
        });
        console.log('Formatted messages:', formattedMessages);
        setMessages(formattedMessages);
      } else {
        // if no messages found, show welcome message
        setMessages([
          {
            id: 1,
            content: `Welcome to our ${session.topic} chat! Let's have fun learning together!`,
            sender: 'ai',
            timestamp: session.started_at
          }
        ]);
      }
    } catch (err) {
      setError('Failed to load chat session');
      // Show welcome message as fallback
      setMessages([
        {
          id: 1,
          content: `Welcome to our ${session.topic} chat! Let's have fun learning together!`,
          sender: 'ai',
          timestamp: session.started_at
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToWelcome = () => {
    setCurrentView('welcome');
    setCurrentSession(null);
    setSelectedTopic('');
    setMessages([]);
    setInputMessage('');
    setError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (currentView === 'welcome') {
    return (
      <div className="ipad-app-bg welcome-bg">
        <div className="app-header-fixed">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
            <span>Kids AI Chat</span>
            <button 
              onClick={handleLogout}
              style={{
                padding: '6px 12px',
                backgroundColor: '#ff6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Logout
            </button>
          </div>
        </div>
        <div className="welcome-center">
          <h1 className="welcome-title">Hello {child.name}! 👋</h1>
          <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '32px', textAlign: 'center' }}>
            What would you like to learn about today?
          </p>
          <div className="welcome-topics">
            {topics.map((topic, index) => (
              <button
                key={index}
                className="topic-btn big"
                onClick={() => startNewChat(topic)}
                disabled={isLoading}
              >
                {topic}
              </button>
            ))}
          </div>
          {chatSessions.length > 0 && (
            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <h3 style={{ color: '#ff7eb9', marginBottom: '16px' }}>Recent Chats</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                {chatSessions.slice(0, 3).map((session) => (
                  <button
                    key={session.id}
                    onClick={() => loadChatSession(session)}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '12px',
                      background: '#fff',
                      color: '#333',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    {session.topic} - {new Date(session.started_at).toLocaleDateString()}
                  </button>
                ))}
              </div>
            </div>
          )}
          {error && <div style={{ color: 'red', marginTop: '16px' }}>{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="ipad-app-bg">
      <div className="app-header-fixed">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
          <span>Kids AI Chat</span>
          <button 
            onClick={handleLogout}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="chat-layout">
        <div className="chat-main-row">
          {/* Sidebar */}
          <div className="chat-sidebar">
            <div className="sidebar-title">Chat History</div>
            <button className="sidebar-back-btn" onClick={goBackToWelcome}>
              ← Back to Topics
            </button>
            {chatSessions.length === 0 ? (
              <div className="sidebar-empty">No previous chats</div>
            ) : (
              chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`sidebar-chat-item ${currentSession?.id === session.id ? 'active' : ''}`}
                  onClick={() => loadChatSession(session)}
                >
                  <div style={{ fontWeight: 'bold' }}>{session.topic}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {new Date(session.started_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Main Chat Area */}
          <div className="chat-main-area">
            <div className="chat-topic-title">
              {selectedTopic}
            </div>
            
            <div className="chat-area-scroll">
              <div className="chat-area-chat">
                {messages.map((message) => (
                  <div key={message.id} className="msg-container">
                    <div className={`msg ${message.sender === 'kid' ? 'msg-kid-right' : 'msg-ai-left'}`}>
                      {message.content}
                      {message.buttons && message.buttons.length > 0 && (
                        <div className="msg-buttons">
                          {message.buttons.map((button, index) => (
                            <button
                              key={index}
                              className="msg-btn"
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
                {isLoading && (
                  <div className="msg-container">
                    <div className="msg msg-ai loading">
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="input-row-fixed chat-input-row">
              <button className="mic-btn" disabled={isLoading}>
                🎤
              </button>
              <input
                className="chat-input"
                type="text"
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ff4444',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          {error}
        </div>
      )}
    </div>
  );
} 