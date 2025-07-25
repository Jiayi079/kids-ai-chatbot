import { useEffect, useState } from 'react';

export default function ParentDashboard({ token }) {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [usageLimit, setUsageLimit] = useState('');
  const [message, setMessage] = useState('');
  const [newChild, setNewChild] = useState({ name: '', age: '', username: '', password: '', daily_limit_minutes: 60 });
  const [childCreateMsg, setChildCreateMsg] = useState('');
  const API_URL = import.meta.env.VITE_API_URL;

  // fetch children on mount
  useEffect(() => {
    fetch(`${API_URL}/children`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setChildren(data.children || []));
  }, [token]);

  // fetch sessions when a child is selected
  useEffect(() => {
    if (selectedChild) {
      fetch(`${API_URL}/chat-session/${selectedChild.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setSessions(data.sessions || []));
      setUsageLimit(selectedChild.daily_limit_minutes);
    }
  }, [selectedChild, token]);

  // Update usage limit
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

  return (
    <div>
      <h2>Parent Dashboard</h2>
      <h3>Add New Child</h3>
      <form onSubmit={handleCreateChild}>
        <input
          placeholder="Name"
          value={newChild.name}
          onChange={e => setNewChild({ ...newChild, name: e.target.value })}
          required
        />
        <input
          placeholder="Age"
          type="number"
          value={newChild.age}
          onChange={e => setNewChild({ ...newChild, age: e.target.value })}
          required
        />
        <input
          placeholder="Username"
          value={newChild.username}
          onChange={e => setNewChild({ ...newChild, username: e.target.value })}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={newChild.password}
          onChange={e => setNewChild({ ...newChild, password: e.target.value })}
          required
        />
        <input
          placeholder="Daily Limit (minutes)"
          type="number"
          value={newChild.daily_limit_minutes}
          onChange={e => setNewChild({ ...newChild, daily_limit_minutes: e.target.value })}
          min={1}
        />
        <button type="submit">Create Child</button>
        {childCreateMsg && <div>{childCreateMsg}</div>}
      </form>
      <h3>Your Children</h3>
      <ul>
        {children.map(child => (
          <li key={child.id}>
            <button onClick={() => setSelectedChild(child)}>
              {child.name} (age {child.age})
            </button>
          </li>
        ))}
      </ul>
      {selectedChild && (
        <div>
          <h4>Chat Sessions for {selectedChild.name}</h4>
          <ul>
            {sessions.map(session => (
              <li key={session.id}>
                Topic: {session.topic} | Started: {new Date(session.started_at).toLocaleString()} | Messages: {session.total_messages}
                {/* You can add a button to view chat history for this session */}
              </li>
            ))}
          </ul>
          <form onSubmit={handleUsageLimitChange}>
            <label>
              Usage Limit (minutes per day):
              <input
                type="number"
                value={usageLimit}
                onChange={e => setUsageLimit(e.target.value)}
                min={1}
              />
            </label>
            <button type="submit">Update Limit</button>
          </form>
          {message && <div>{message}</div>}
        </div>
      )}
      {/* Payment section can be added here in the future */}
    </div>
  );
}
