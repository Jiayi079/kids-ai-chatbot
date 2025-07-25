import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ParentRegister from './ParentRegister';
import Login from './Login';
import ParentDashboard from './ParentDashboard';
import ChildChat from './ChildChat';
import { useState } from 'react';

function App() {
  const [user, setUser] = useState(() => {
    // load user from localStorage on app startup to keep user logged in
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // helper function to update both state and localStorage
  const handleSetUser = (userObj) => {
    setUser(userObj);
    if (userObj) {
      localStorage.setItem('user', JSON.stringify(userObj));
    } else {
      localStorage.removeItem('user');
    }
  };

  // Logout function
  const handleLogout = () => {
    handleSetUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<ParentRegister onRegister={handleSetUser} />} />
        <Route path="/login" element={<Login onLogin={handleSetUser} />} />
        <Route path="/parent-dashboard" element={user && user.token && user.user ? <ParentDashboard token={user.token} /> : <Navigate to="/login" />} />
        <Route path="/child-chat" element={user && user.token && user.child ? <ChildChat token={user.token} child={user.child} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;