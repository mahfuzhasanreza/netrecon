import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig.jsx';
import '../styles/Reports.css';

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingTest, setGeneratingTest] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get('/api/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportName) => {
    try {
      const response = await axios.get(
        `/api/reports/download/${reportName}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', reportName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      alert('Error downloading report');
    }
  };

  const generateTestReport = async () => {
    setGeneratingTest(true);
    try {
      const response = await axios.post('/api/reports/generate-test');
      // Refresh reports list
      await fetchReports();
      alert('Test report generated successfully!');
    } catch (error) {
      alert('Error generating test report: ' + error.message);
    } finally {
      setGeneratingTest(false);
    }
  };

  if (loading) {
    return <div className="reports"><p>Loading reports...</p></div>;
  }

  return (
    <div className="reports">
      <div className="reports-header">
        <h2>📄 Scan Reports</h2>
        <button 
          onClick={generateTestReport} 
          disabled={generatingTest}
          className="generate-test-btn"
        >
          {generatingTest ? '⏳ Generating...' : '✨ Generate Test Report'}
        </button>
      </div>
      <div className="reports-grid">
        {reports.length === 0 ? (
          <div className="no-reports">
            <p>📭 No reports found</p>
            <p className="hint">Run scans to generate reports</p>
          </div>
        ) : (
          reports.map((report, index) => (
            <div key={index} className="report-card">
              <div className="report-header">
                <h3>📋 {report.name}</h3>
              </div>
              <div className="report-body">
                <p className="report-date">
                  {new Date(report.createdAt).toLocaleDateString()} {' '}
                  {new Date(report.createdAt).toLocaleTimeString()}
                </p>
                <p className="report-size">{(report.size / 1024).toFixed(2)} KB</p>
              </div>
              <div className="report-actions">
                <a
                  href={report.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-btn view"
                >
                  👁️ View
                </a>
                <button
                  onClick={() => handleDownload(report.name)}
                  className="action-btn download"
                >
                  ⬇️ Download
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Reports;
