import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentSection from './PaymentSection';

export default function ParentDashboard({ token }) {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [usageLimit, setUsageLimit] = useState('');
  const [message, setMessage] = useState('');
  const [newChild, setNewChild] = useState({ name: '', age: '', username: '', password: '', daily_limit_minutes: 60 });
  const [childCreateMsg, setChildCreateMsg] = useState('');
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [sessionMessages, setSessionMessages] = useState({});
  const [childUsageData, setChildUsageData] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${API_URL}/children`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setChildren(data.children || []);
        // Fetch usage data for all children
        if (data.children && data.children.length > 0) {
          data.children.forEach(child => {
            fetchChildUsage(child.id);
          });
        }
      });
  }, [token]);

  const fetchChildUsage = async (childId) => {
    try {
      const res = await fetch(`${API_URL}/children/${childId}/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const usageData = await res.json();
        setChildUsageData(prev => ({
          ...prev,
          [childId]: usageData
        }));
      }
    } catch (err) {
      console.error('Failed to fetch child usage:', err);
    }
  };

  useEffect(() => {
    if (selectedChild) {
      fetch(`${API_URL}/chat-session/${selectedChild.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setSessions(data.sessions || []));
      setUsageLimit(selectedChild.daily_limit_minutes);
      // clear session messages when switching to a different child (to avoid showing old messages)
      setSessionMessages({});
      setExpandedSessionId(null);
    } else {
      setSessions([]);
      setSessionMessages({});
      setExpandedSessionId(null);
    }
  }, [selectedChild, token]);

  const handleUsageLimitChange = async (e) => {
    e.preventDefault();
    setMessage('');
    const res = await fetch(`${API_URL}/children/${selectedChild.id}/usage-limit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ daily_limit_minutes: usageLimit })
    });
    if (res.ok) {
      setMessage('Usage limit updated!');
      setSelectedChild({ ...selectedChild, daily_limit_minutes: usageLimit });
      // refresh usage data to update percentage calculation
      await fetchChildUsage(selectedChild.id);
    } else {
      setMessage('Failed to update usage limit.');
    }
  };

  const handleCreateChild = async (e) => {
    e.preventDefault();
    setChildCreateMsg('');
    try {
      const res = await fetch(`${API_URL}/children`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newChild)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create child');
      setChildren([...children, data.child]);
      setChildCreateMsg('Child created!');
      setNewChild({ name: '', age: '', username: '', password: '', daily_limit_minutes: 60 });
    } catch (err) {
      setChildCreateMsg(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleExpandSession = async (sessionId) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      return;
    }
    setExpandedSessionId(sessionId);
    if (!sessionMessages[sessionId]) {
      const res = await fetch(`${API_URL}/chat-message/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessionMessages(prev => ({ ...prev, [sessionId]: data.messages || [] }));
      }
    }
  };

  return (
    <div style={{ height: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', boxSizing: 'border-box', flex: '0 0 auto', background: '#fff', borderBottom: '1px solid #e3e3e3' }}>
        <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2d3a4a', letterSpacing: 1, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '1.8rem', marginRight: 8 }}></span> Kids AI Chat </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button 
            onClick={() => setShowPaymentModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px #e3e3e3',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span style={{ fontSize: '1rem' }}>💳</span>
            Subscription
          </button>
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e57373',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px #e3e3e3',
            }}
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Three-column dashboard layout */}
      <div style={{ flex: 1, display: 'flex', gap: 16, padding: '16px', minHeight: 0, overflow: 'hidden' }}>
        {/* Children sidebar */}
        <div style={{ width: '280px', minWidth: '240px', background: '#f4f7fa', borderRadius: 16, boxShadow: '0 2px 8px #e3e3e3', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: '1.2rem', color: '#2d3a4a', fontWeight: 'bold', textAlign: 'center', margin: '20px 0 16px 0', flex: '0 0 auto' }}>Your Children</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px 16px' }}>
            {children.length === 0 ? (
              <div style={{ color: '#b0b0b0', textAlign: 'center', margin: '24px 0' }}>No children yet</div>
            ) : (
              children.map((child, idx) => (
                <div
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  style={{
                    fontSize: '1rem',
                    padding: '12px',
                    margin: '0 0 12px 0',
                    borderRadius: 12,
                    background: selectedChild?.id === child.id
                      ? 'linear-gradient(90deg, #e3f0ff 0%, #b6e0fe 100%)'
                      : '#fff',
                    color: '#2d3a4a',
                    cursor: 'pointer',
                    fontWeight: selectedChild?.id === child.id ? 700 : 500,
                    border: selectedChild?.id === child.id ? '2px solid #b6e0fe' : '1px solid #e3e3e3',
                    boxShadow: '0 2px 4px #e3e3e3',
                    transition: 'background 0.2s, border 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{child.name} <span style={{ color: '#888', fontWeight: 400 }}>(age {child.age})</span></div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 3 }}>
                    Usage: <span style={{ fontWeight: 600 }}>{childUsageData[child.id]?.todayUsage || 0} min</span>
                    {childUsageData[child.id]?.usagePercentage !== undefined && (
                      <span style={{ 
                        color: childUsageData[child.id]?.usagePercentage > 80 ? '#e57373' : 
                               childUsageData[child.id]?.usagePercentage > 60 ? '#ff9800' : '#2d3a4a', 
                        marginLeft: 4, fontSize: '0.8rem' 
                      }}>
                        ({childUsageData[child.id]?.usagePercentage}%)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 2 }}>
                    Limit: <span style={{ fontWeight: 600 }}>{child.daily_limit_minutes} min/day</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Center column: add child form and selected child details */}
        <div style={{ flex: 1, maxWidth: '400px', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {/* Selected child details */}
          {selectedChild && (
            <div style={{ width: '100%', background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #e3e3e3', padding: '24px', border: '1px solid #e3e3e3', marginBottom: 16, overflow: 'auto' }}>
              <span style={{ fontSize: '1.4rem', color: '#2d3a4a', fontWeight: 800, marginBottom: 12, textAlign: 'center', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.4rem' }}>👦</span> {selectedChild.name} (age {selectedChild.age})
              </span>
              <div style={{ fontSize: '1rem', color: '#666', marginBottom: 8 }}>
                Usage today: <span style={{ fontWeight: 600 }}>{childUsageData[selectedChild.id]?.todayUsage || 0} min</span>
                {childUsageData[selectedChild.id]?.usagePercentage !== undefined && (
                  <span style={{ color: childUsageData[selectedChild.id]?.usagePercentage > 80 ? '#e57373' : '#2d3a4a', marginLeft: 8 }}>
                    ({childUsageData[selectedChild.id]?.usagePercentage}% of daily limit)
                  </span>
                )}
              </div>
              <div style={{ fontSize: '1rem', color: '#666', marginBottom: 16 }}>
                Usage limit: <span style={{ fontWeight: 600 }}>{selectedChild.daily_limit_minutes} min/day</span>
              </div>
              <form onSubmit={handleUsageLimitChange} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <label style={{ fontSize: '0.95rem', color: '#2d3a4a', fontWeight: 600 }}>
                  Set usage limit:
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={e => setUsageLimit(e.target.value)}
                    min={1}
                    style={{ fontSize: '0.95rem', padding: '6px', borderRadius: 6, border: '2px solid #b6e0fe', color: '#2d3a4a', marginLeft: 6, width: 70 }}
                  />
                </label>
                <button type="submit" style={{ fontSize: '0.95rem', padding: '8px 14px', borderRadius: 6, background: 'linear-gradient(90deg, #b6e0fe 0%, #e3f0ff 100%)', color: '#2d3a4a', fontWeight: 'bold', border: 'none', boxShadow: '0 2px 8px #e3e3e3' }}>Update Limit</button>
              </form>
              <button 
                onClick={() => selectedChild && fetchChildUsage(selectedChild.id)}
                style={{ fontSize: '0.9rem', padding: '6px 12px', borderRadius: 6, background: 'linear-gradient(90deg, #fffbe7 0%, #ffe9b2 100%)', color: '#2d3a4a', fontWeight: 'bold', border: 'none', boxShadow: '0 2px 8px #e3e3e3', marginBottom: 16 }}
              >
                🔄 Refresh Usage
              </button>
              {message && <div style={{ color: message.includes('updated') ? '#2d3a4a' : '#e57373', marginBottom: 12 }}>{message}</div>}
            </div>
          )}
          
          {/* Add new child form */}
          <div style={{ width: '100%', background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #e3e3e3', padding: '24px', border: '1px solid #e3e3e3', overflow: 'auto' }}>
            <span style={{ fontSize: '1.5rem', color: '#2d3a4a', fontWeight: 800, marginBottom: 16, textAlign: 'center', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>➕</span> Add New Child
            </span>
            <form onSubmit={handleCreateChild} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                placeholder="Name"
                style={{ fontSize: '1rem', padding: '12px', borderRadius: 8, border: '2px solid #b6e0fe', color: '#2d3a4a' }}
                value={newChild.name}
                onChange={e => setNewChild({ ...newChild, name: e.target.value })}
                required
              />
              <input
                placeholder="Age"
                type="number"
                style={{ fontSize: '1rem', padding: '12px', borderRadius: 8, border: '2px solid #ffe9b2', color: '#2d3a4a' }}
                value={newChild.age}
                onChange={e => setNewChild({ ...newChild, age: e.target.value })}
                required
              />
              <input
                placeholder="Username"
                style={{ fontSize: '1rem', padding: '12px', borderRadius: 8, border: '2px solid #b6e0fe', color: '#2d3a4a' }}
                value={newChild.username}
                onChange={e => setNewChild({ ...newChild, username: e.target.value })}
                required
              />
              <input
                placeholder="Password"
                type="password"
                style={{ fontSize: '1rem', padding: '12px', borderRadius: 8, border: '2px solid #e3e3e3', color: '#2d3a4a' }}
                value={newChild.password}
                onChange={e => setNewChild({ ...newChild, password: e.target.value })}
                required
              />
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 4, marginBottom: 8, lineHeight: 1.3 }}>
                Set daily usage limit (minutes):
                <br />
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                  Free: 60 min • Basic: 120 min • Premium: Unlimited
                </span>
              </div>
              <input
                placeholder="Daily Limit (minutes)"
                type="number"
                style={{ fontSize: '1rem', padding: '12px', borderRadius: 8, border: '2px solid #ffe9b2', color: '#2d3a4a' }}
                value={newChild.daily_limit_minutes}
                onChange={e => setNewChild({ ...newChild, daily_limit_minutes: e.target.value })}
                min={1}
              />
              <button type="submit" style={{ fontSize: '1rem', padding: '12px', borderRadius: 8, background: 'linear-gradient(90deg, #b6e0fe 0%, #e3f0ff 100%)', color: '#2d3a4a', fontWeight: 'bold', border: 'none', boxShadow: '0 2px 8px #e3e3e3', width: '100%' }}>Create Child</button>
              {childCreateMsg && <div style={{ color: childCreateMsg.includes('created') ? '#2d3a4a' : '#e57373', marginTop: 8, fontSize: '1.1rem' }}>{childCreateMsg}</div>}
            </form>
          </div>
        </div>
        
        {/* Right column: selected child's chat sessions/history */}
        <div style={{ width: '500px', minWidth: '450px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #e3e3e3', padding: '24px', border: '1px solid #e3e3e3', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span style={{ fontSize: '1.4rem', color: '#2d3a4a', fontWeight: 800, marginBottom: 16, textAlign: 'center', display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 auto' }}>
            <span style={{ fontSize: '1.4rem' }}>💬</span> {selectedChild ? `${selectedChild.name}'s Chat Sessions` : 'Chat Sessions & History'}
          </span>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%', flex: 1, overflowY: 'auto' }}>
            {!selectedChild ? (
              <li style={{ color: '#b0b0b0', textAlign: 'center', margin: '24px 0' }}>Select a child to view their chat sessions</li>
            ) : sessions.length === 0 ? (
              <li style={{ color: '#b0b0b0', textAlign: 'center', margin: '24px 0' }}>No chat sessions yet</li>
            ) : (
              sessions.map(session => (
                <li key={session.id} style={{ marginBottom: 16, fontSize: '1.1rem', color: '#2d3a4a', background: '#f4f7fa', borderRadius: 12, padding: '16px 20px', boxShadow: '0 2px 6px #e3e3e3', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 4 }}>{session.topic}</div>
                      <div style={{ color: '#888', fontWeight: 400, fontSize: '0.9rem' }}>
                        {new Date(session.started_at).toLocaleString()} • Messages: {session.total_messages}
                      </div>
                    </div>
                    <button
                      style={{ fontSize: '1.05rem', padding: '7px 16px', borderRadius: 8, background: 'linear-gradient(90deg, #b6e0fe 0%, #e3f0ff 100%)', color: '#2d3a4a', fontWeight: 'bold', border: 'none', boxShadow: '0 2px 8px #e3e3e3', cursor: 'pointer' }}
                      onClick={() => handleExpandSession(session.id)}
                    >
                      {expandedSessionId === session.id ? 'Hide History' : 'View History'}
                    </button>
                  </div>
                  {expandedSessionId === session.id && (
                    <div style={{ marginTop: 16, background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px #e3e3e3', padding: '16px 20px' }}>
                      {sessionMessages[session.id] && sessionMessages[session.id].length > 0 ? (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {sessionMessages[session.id].map(msg => (
                            <li key={msg.id} style={{ marginBottom: 12, fontSize: '1rem', color: msg.from_type === 'ai' ? '#2d3a4a' : '#1a7fa7', textAlign: msg.from_type === 'ai' ? 'left' : 'right' }}>
                              <div style={{ 
                                background: msg.from_type === 'ai' ? '#f8f9fa' : '#e3f0ff', 
                                padding: '10px 14px', 
                                borderRadius: 12, 
                                display: 'inline-block',
                                maxWidth: '85%',
                                wordWrap: 'break-word'
                              }}>
                                <span style={{ fontWeight: msg.from_type === 'ai' ? 600 : 500, fontSize: '0.9rem', color: msg.from_type === 'ai' ? '#666' : '#1a7fa7' }}>
                                  {msg.from_type === 'ai' ? 'AI' : 'Child'}
                                </span>
                                <div style={{ marginTop: 4, lineHeight: 1.4 }}>{msg.message_text}</div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div style={{ color: '#b0b0b0', textAlign: 'center', padding: '20px' }}>No messages</div>
                      )}
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Payment Modal Overlay */}
      {showPaymentModal && (
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
          onClick={() => setShowPaymentModal(false)}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: 20,
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowPaymentModal(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: '#f5f5f5',
                border: 'none',
                borderRadius: '50%',
                width: 40,
                height: 40,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                color: '#666',
                zIndex: 10
              }}
            >
              ✕
            </button>
            
            {/* Payment Section */}
            <PaymentSection token={token} onClose={() => setShowPaymentModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
