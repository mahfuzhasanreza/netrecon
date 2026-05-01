import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig.jsx';
import io from 'socket.io-client';
import '../styles/Scans.css';

function Scans() {
  const [scans, setScans] = useState([]);
  const [formData, setFormData] = useState({
    target: '',
    scanType: 'quick',
  });
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [generatingTest, setGeneratingTest] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Listen for scan updates
    newSocket.on('scan-update', (data) => {
      console.log('Scan update:', data);
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    fetchScans();
  }, []);

  // Auto-refresh scans every 2 seconds if any are running
  useEffect(() => {
    if (!autoRefresh) return;

    const hasRunningScans = scans.some(s => s.status === 'pending' || s.status === 'running');
    
    if (!hasRunningScans) return;

    const interval = setInterval(() => {
      fetchScans();
    }, 2000);

    return () => clearInterval(interval);
  }, [scans, autoRefresh]);

  const fetchScans = async () => {
    try {
      const response = await axios.get('/api/scans');
      setScans(response.data);
    } catch (error) {
      console.error('Error fetching scans:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/scans', formData);

      setScans((prev) => [response.data.scan, ...prev]);
      setFormData({ target: '', scanType: 'quick' });

      // Emit scan started event
      if (socket) {
        socket.emit('scan-started', formData);
      }
    } catch (error) {
      alert('Error starting scan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateTestScan = async () => {
    setGeneratingTest(true);
    try {
      const response = await axios.post('/api/scans/test-scan');
      setScans((prev) => [response.data.scan, ...prev]);
    } catch (error) {
      alert('Error generating test scan: ' + error.message);
    } finally {
      setGeneratingTest(false);
    }
  };

  return (
    <div className="scans">
      {/* New Scan Form */}
      <div className="scan-form">
        <h3>🔎 Start New Scan</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Target IP / Domain</label>
            <input
              type="text"
              name="target"
              placeholder="192.168.1.1 or example.com"
              value={formData.target}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Scan Type</label>
            <select
              name="scanType"
              value={formData.scanType}
              onChange={handleInputChange}
            >
              <option value="quick">Quick Scan</option>
              <option value="full">Full Scan</option>
              <option value="stealth">Stealth Scan</option>
              <option value="udp">UDP Scan</option>
              <option value="vulnerability">Vulnerability Scan</option>
              <option value="web">Web Scan</option>
              <option value="lan-discovery">LAN Discovery</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? '⏳ Starting Scan...' : '▶️ Start Scan'}
          </button>
        </form>
        <button 
          onClick={generateTestScan} 
          disabled={generatingTest}
          className="test-scan-btn"
        >
          {generatingTest ? '⏳ Creating...' : '✨ Create Test Scan'}
        </button>
      </div>

      {/* Scans History */}
      <div className="scans-history">
        <div className="history-header">
          <h3>📋 Scan History</h3>
          <div className="refresh-status">
            {scans.some(s => s.status === 'pending' || s.status === 'running') && (
              <span className="live-badge">🔄 Live Updates Enabled</span>
            )}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Target</th>
              <th>Scan Type</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Ports Found</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan) => (
              <tr key={scan._id}>
                <td>{scan.target}</td>
                <td className="scan-type">{scan.scanType}</td>
                <td>
                  <span className={`status-badge ${scan.status}`}>
                    {scan.status === 'running' ? '⏳ ' : ''}
                    {scan.status}
                  </span>
                </td>
                <td>{scan.duration ? `${scan.duration}s` : scan.status === 'running' ? '...' : '-'}</td>
                <td>{scan.ports.open.length || 0}</td>
                <td>{new Date(scan.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="action-btn view">👁️ View</button>
                  <button className="action-btn delete">🗑️ Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Scans;
