import React, { useState, useEffect } from 'react';
import axios from './api/axiosConfig.jsx';
import { FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi';
import './App.css';
import Dashboard from './pages/Dashboard.jsx';
import Scans from './pages/Scans.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import Login from './pages/Login.jsx';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in by verifying session
    const verifySession = async () => {
      try {
        const response = await axios.get('/api/auth/verify');
        if (response.data.valid) {
          setIsAuthenticated(true);
          setUser(response.data.user);
        }
      } catch (err) {
        setIsAuthenticated(false);
      }
    };
    verifySession();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    }
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage('dashboard');
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1>🔍 NetRecon</h1>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`nav-item ${currentPage === 'scans' ? 'active' : ''}`}
            onClick={() => setCurrentPage('scans')}
          >
            🔎 Scans
          </button>
          <button
            className={`nav-item ${currentPage === 'reports' ? 'active' : ''}`}
            onClick={() => setCurrentPage('reports')}
          >
            📄 Reports
          </button>
          <button
            className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentPage('settings')}
          >
            ⚙️ Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <FiUser />
            <span>{user?.username}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="app-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <h2>{currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}</h2>
          <div className="header-right">
            <span className="timestamp">{new Date().toLocaleTimeString()}</span>
          </div>
        </header>

        {/* Content Area */}
        <section className="content">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'scans' && <Scans />}
          {currentPage === 'reports' && <Reports />}
          {currentPage === 'settings' && <Settings user={user} />}
        </section>
      </main>
    </div>
  );
}

export default App;
