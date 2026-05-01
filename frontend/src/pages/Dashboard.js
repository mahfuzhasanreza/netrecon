import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalScans: 0,
    completedScans: 0,
    failedScans: 0,
    successRate: 0,
  });
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, scansResponse] = await Promise.all([
        axios.get('/api/scans/stats/overview'),
        axios.get('/api/scans'),
      ]);

      setStats(statsResponse.data);
      setRecentScans(scansResponse.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate chart data from actual scans
  const generateChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = days.map(day => ({ name: day, scans: 0, completed: 0, failed: 0 }));

    recentScans.forEach(scan => {
      const scanDate = new Date(scan.createdAt);
      const dayIndex = scanDate.getDay();
      
      if (weekData[dayIndex]) {
        weekData[dayIndex].scans += 1;
        if (scan.status === 'completed') {
          weekData[dayIndex].completed += 1;
        } else if (scan.status === 'failed') {
          weekData[dayIndex].failed += 1;
        }
      }
    });

    return weekData;
  };

  const chartData = generateChartData();

  if (loading) {
    return <div className="dashboard"><p>Loading...</p></div>;
  }

  return (
    <div className="dashboard">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Scans</h3>
          <p className="stat-value">{stats.totalScans}</p>
        </div>
        <div className="stat-card success">
          <h3>Completed</h3>
          <p className="stat-value">{stats.completedScans}</p>
        </div>
        <div className="stat-card danger">
          <h3>Failed</h3>
          <p className="stat-value">{stats.failedScans}</p>
        </div>
        <div className="stat-card info">
          <h3>Success Rate</h3>
          <p className="stat-value">{stats.successRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Weekly Scan Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="scans" stroke="#FF4D00" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Scan Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#51cf66" name="Completed" />
              <Bar dataKey="failed" fill="#ff6b6b" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Scans */}
      <div className="recent-scans">
        <h3>Recent Scans</h3>
        <table>
          <thead>
            <tr>
              <th>Target</th>
              <th>Scan Type</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentScans.map((scan) => (
              <tr key={scan._id}>
                <td>{scan.target}</td>
                <td>{scan.scanType}</td>
                <td>
                  <span className={`status-badge ${scan.status}`}>
                    {scan.status}
                  </span>
                </td>
                <td>{new Date(scan.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
