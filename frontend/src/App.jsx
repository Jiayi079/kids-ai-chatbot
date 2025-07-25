import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ParentRegister from './ParentRegister';
import Login from './Login';
import ParentDashboard from './ParentDashboard';
import ChildMain from './ChildMain';
import ChildChat from './ChildChat';
import { useState } from 'react';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleSetUser = (userObj) => {
    setUser(userObj);
    if (userObj) {
      localStorage.setItem('user', JSON.stringify(userObj));
    } else {
      localStorage.removeItem('user');
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<ParentRegister onRegister={handleSetUser} />} />
        <Route path="/login" element={<Login onLogin={(data, mode) => {
          handleSetUser(data);
          if (mode === 'parent') {
            window.location.href = '/parent-dashboard';
          } else {
            window.location.href = '/child-main';
          }
        }} />} />
        <Route path="/parent-dashboard" element={user && user.token && user.user ? <ParentDashboard token={user.token} /> : <Navigate to="/login" />} />
        <Route path="/child-main" element={user && user.token && user.child ? <ChildMain token={user.token} child={user.child} /> : <Navigate to="/login" />} />
        <Route path="/child-chat/:sessionId" element={user && user.token && user.child ? <ChildChat token={user.token} child={user.child} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;