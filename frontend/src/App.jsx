import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ParentRegister from './ParentRegister';
import Login from './Login';
import ParentDashboard from './ParentDashboard';
import { useState } from 'react';

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<ParentRegister onRegister={setUser} />} />
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="/parent-dashboard" element={user && user.token && user.user ? <ParentDashboard token={user.token} /> : <Navigate to="/login" />} />
        <Route path="/child-chat" element={user && user.token && user.child ? <div>Child Chat</div> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;