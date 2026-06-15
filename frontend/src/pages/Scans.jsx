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
  const [selectedScan, setSelectedScan] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [scanNotes, setScanNotes] = useState('');
  const [scanTags, setScanTags] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('portScan');

  useEffect(() => {
    // Initialize socket connection with error handling
    try {
      const newSocket = io('http://localhost:5000', {
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });
      setSocket(newSocket);

      // Listen for scan updates
      newSocket.on('scan-update', (data) => {
        console.log('Scan update:', data);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      return () => newSocket.close();
    } catch (err) {
      console.error('Socket initialization error:', err);
    }
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

  const handleViewScan = async (scanId) => {
    console.log('Fetching scan details for:', scanId);
    try {
      const response = await axios.get(`/api/scans/${scanId}`);
      console.log('Scan details received:', response.data);
      setSelectedScan(response.data);
      setScanNotes(response.data.notes || '');
      setScanTags(response.data.tags ? response.data.tags.join(', ') : '');
      setIsBookmarked(response.data.isBookmarked || false);
      setShowDetails(true);
    } catch (error) {
      console.error('Error fetching scan details:', error.response?.data || error.message);
      alert('Error fetching scan details: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteScan = async (scanId) => {
    if (!window.confirm('Are you sure you want to delete this scan?')) return;
    
    console.log('Deleting scan:', scanId);
    setDeleting(true);
    try {
      const response = await axios.delete(`/api/scans/${scanId}`);
      console.log('Delete response:', response.data);
      setScans((prev) => prev.filter((s) => s._id !== scanId));
      alert('Scan deleted successfully');
    } catch (error) {
      console.error('Error deleting scan:', error.response?.data || error.message);
      alert('Error deleting scan: ' + (error.response?.data?.error || error.message));
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateScan = async () => {
    if (!selectedScan) return;
    
    console.log('Updating scan:', selectedScan._id);
    setUpdating(true);
    try {
      const updateData = {
        notes: scanNotes,
        tags: scanTags.split(',').map(tag => tag.trim()).filter(tag => tag),
        isBookmarked: isBookmarked,
      };
      
      const response = await axios.put(`/api/scans/${selectedScan._id}`, updateData);
      console.log('Update response:', response.data);
      
      // Update local state
      setScans((prev) =>
        prev.map((s) => (s._id === selectedScan._id ? response.data : s))
      );
      setSelectedScan(response.data);
      alert('Scan updated successfully');
    } catch (error) {
      console.error('Error updating scan:', error.response?.data || error.message);
      alert('Error updating scan: ' + (error.response?.data?.error || error.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleBookmark = async () => {
    setIsBookmarked(!isBookmarked);
  };

  return (
    <div className="scans">
      {/* New Scan Form */}
      <div className="scan-form">
        <h3>Start New Scan</h3>
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
              <option value="msf-vulnerability">Metasploit Vulnerability Analysis</option>
              <option value="msf-exploit">Metasploit Exploit Suggestion</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Starting Scan...' : 'Start Scan'}
          </button>
        </form>
      
      </div>

      {/* Scans History */}
      <div className="scans-history">
        <div className="history-header">
          <h3>Scan History</h3>
          <div className="refresh-status">
            {scans.some(s => s.status === 'pending' || s.status === 'running') && (
              <span className="live-badge">Live Updates Enabled</span>
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
                    {scan.status === 'running' ? '' : ''}
                    {scan.status}
                  </span>
                </td>
                <td>{scan.duration ? `${scan.duration}s` : scan.status === 'running' ? '...' : '-'}</td>
                <td>{scan.ports.open.length || 0}</td>
                <td>{new Date(scan.createdAt).toLocaleDateString()}</td>
                <td>
                  <button 
                    className="action-btn view"
                    onClick={() => handleViewScan(scan._id)}
                  >
                    View
                  </button>
                  {/* {scan.reportPath && (
                    <button 
                      className="action-btn report"
                      onClick={() => window.open(scan.reportPath, '_blank')}
                      title="Open generated report"
                    >
                      Report
                    </button>
                  )} */}
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDeleteScan(scan._id)}
                    disabled={deleting}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Scan Details Modal */}
      {showDetails && selectedScan && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Scan Details</h2>
              <div className="modal-actions-top">
                <button 
                  className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
                  onClick={handleToggleBookmark}
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark this scan'}
                >
                  {isBookmarked ? '⭐' : '☆'}
                </button>
                <button 
                  className="modal-close"
                  onClick={() => setShowDetails(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="modal-body">
              <div className="detail-group">
                <label>Target:</label>
                <p>{selectedScan.target}</p>
              </div>
              <div className="detail-group">
                <label>Scan Type:</label>
                <p>{selectedScan.scanType}</p>
              </div>
              <div className="detail-group">
                <label>Status:</label>
                <p>
                  <span className={`status-badge ${selectedScan.status}`}>
                    {selectedScan.status}
                  </span>
                </p>
              </div>
              <div className="detail-group">
                <label>Duration:</label>
                <p>{selectedScan.duration ? `${selectedScan.duration}s` : 'N/A'}</p>
              </div>
              
              {/* {selectedScan.reportPath && (
                <div className="detail-group">
                  <label>Generated Report:</label>
                  <button 
                    className="report-link-btn"
                    onClick={() => window.open(selectedScan.reportPath, '_blank')}
                  >
                    Open Report
                  </button>
                </div>
              )} */}

              <div className="detail-group">
                <label>Open Ports:</label>
                <p>{selectedScan.ports.open.join(', ') || 'None'}</p>
              </div>
              <div className="detail-group">
                <label>Created:</label>
                <p>{new Date(selectedScan.createdAt).toLocaleString()}</p>
              </div>

              {/* Editable Fields */}
              <div className="detail-group">
                <label>Tags:</label>
                <input
                  type="text"
                  value={scanTags}
                  onChange={(e) => setScanTags(e.target.value)}
                  placeholder="Enter tags separated by commas (e.g., important, follow-up)"
                  className="edit-input"
                />
              </div>

              <div className="detail-group">
                <label>Notes:</label>
                <textarea
                  value={scanNotes}
                  onChange={(e) => setScanNotes(e.target.value)}
                  placeholder="Add notes about this scan..."
                  className="edit-textarea"
                  rows="4"
                />
              </div>

              <div className="detail-group">
                <label>Port Information:</label>
                <div className="ports-info">
                  {selectedScan.ports.open.length > 0 && (
                    <p className="port-status open">Open: {selectedScan.ports.open.join(', ')}</p>
                  )}
                  {selectedScan.ports.closed.length > 0 && (
                    <p className="port-status closed">Closed: {selectedScan.ports.closed.join(', ')}</p>
                  )}
                  {selectedScan.ports.filtered.length > 0 && (
                    <p className="port-status filtered">Filtered: {selectedScan.ports.filtered.join(', ')}</p>
                  )}
                  {selectedScan.ports.open.length === 0 && 
                   selectedScan.ports.closed.length === 0 && 
                   selectedScan.ports.filtered.length === 0 && (
                    <p>No ports found</p>
                  )}
                </div>
              </div>

              {/* Scan Results Tabs */}
              {selectedScan.results && Object.keys(selectedScan.results).length > 0 && (
                <div className="detail-group">
                  <label>Scan Results:</label>
                  <div className="result-tabs">
                    {selectedScan.results.hostDiscovery && (
                      <button
                        className={`tab-btn ${activeResultTab === 'hostDiscovery' ? 'active' : ''}`}
                        onClick={() => setActiveResultTab('hostDiscovery')}
                      >
                        Host Discovery
                      </button>
                    )}
                    {selectedScan.results.portScan && (
                      <button
                        className={`tab-btn ${activeResultTab === 'portScan' ? 'active' : ''}`}
                        onClick={() => setActiveResultTab('portScan')}
                      >
                        Port Scan
                      </button>
                    )}
                    {selectedScan.results.serviceDetection && (
                      <button
                        className={`tab-btn ${activeResultTab === 'serviceDetection' ? 'active' : ''}`}
                        onClick={() => setActiveResultTab('serviceDetection')}
                      >
                        Service Detection
                      </button>
                    )}
                    {selectedScan.results.osDetection && (
                      <button
                        className={`tab-btn ${activeResultTab === 'osDetection' ? 'active' : ''}`}
                        onClick={() => setActiveResultTab('osDetection')}
                      >
                        OS Detection
                      </button>
                    )}
                    {selectedScan.results.msfAnalysis && (
                      <button
                        className={`tab-btn ${activeResultTab === 'msfAnalysis' ? 'active' : ''}`}
                        onClick={() => setActiveResultTab('msfAnalysis')}
                      >
                        MSF Analysis
                      </button>
                    )}
                    {selectedScan.results.msfExploit && (
                      <button
                        className={`tab-btn ${activeResultTab === 'msfExploit' ? 'active' : ''}`}
                        onClick={() => setActiveResultTab('msfExploit')}
                      >
                        Exploit Suggestions
                      </button>
                    )}
                    {selectedScan.results.riskLevel && (
                      <button
                        className={`tab-btn ${activeResultTab === 'riskLevel' ? 'active' : ''}`}
                        onClick={() => setActiveResultTab('riskLevel')}
                      >
                        Risk Level
                      </button>
                    )}
                    {selectedScan.results.summary && (
                      <button
                        className={`tab-btn ${activeResultTab === 'summary' ? 'active' : ''}`}
                        onClick={() => setActiveResultTab('summary')}
                      >
                        Summary
                      </button>
                    )}
                    {selectedScan.results.error && (
                      <button
                        className={`tab-btn ${activeResultTab === 'error' ? 'active' : ''}`}
                        onClick={() => setActiveResultTab('error')}
                      >
                        Error
                      </button>
                    )}
                  </div>
                  <pre className="output-box">
                    {selectedScan.results[activeResultTab] || 
                     (selectedScan.results.error && activeResultTab === 'error' 
                       ? selectedScan.results.error 
                       : 'No data available')}
                  </pre>
                </div>
              )}

              {/* Action Buttons */}
              <div className="modal-actions">
                <button 
                  className="btn-save"
                  onClick={handleUpdateScan}
                  disabled={updating}
                >
                  {updating ? 'Saving...' : 'Save'}
                </button>
                <button 
                  className="btn-cancel"
                  onClick={() => setShowDetails(false)}
                  disabled={updating}
                >
                  ✕ Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scans;
