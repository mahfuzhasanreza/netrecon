import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig.jsx';
import '../styles/Reports.css';

// Color mapping for scan type badges
const SCAN_TYPE_COLORS = {
  'quick': { bg: '#e3f2fd', color: '#1565c0' },
  'full': { bg: '#e8f5e9', color: '#2e7d32' },
  'stealth': { bg: '#f3e5f5', color: '#7b1fa2' },
  'udp': { bg: '#fff3e0', color: '#e65100' },
  'vulnerability': { bg: '#fce4ec', color: '#c62828' },
  'web': { bg: '#e0f7fa', color: '#00695c' },
  'lan-discovery': { bg: '#f1f8e9', color: '#558b2f' },
  'msf-vulnerability': { bg: '#ede7f6', color: '#4527a0' },
  'msf-exploit': { bg: '#fff8e1', color: '#f57f17' },
};

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingTest, setGeneratingTest] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      console.log('Fetching reports list...');
      const response = await axios.get('/api/reports');
      console.log('Reports fetched:', response.data.length, 'reports found');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error.response?.data || error.message);
      alert('Error loading reports: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (reportName, displayName) => {
    console.log('Viewing report:', reportName);
    setPreviewLoading(true);
    try {
      const response = await axios.get(`/api/reports/${reportName}`);
      console.log('Report content loaded');
      setSelectedReport({
        name: reportName,
        displayName: displayName || reportName,
        content: response.data,
      });
      setShowPreview(true);
    } catch (error) {
      console.error('Error loading report:', error.response?.data || error.message);
      alert('Error loading report: ' + (error.response?.data?.error || error.message));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (reportName) => {
    console.log('Downloading report:', reportName);
    try {
      const response = await axios.get(
        `/api/reports/download/${reportName}`,
        { responseType: 'blob' }
      );

      console.log('Report downloaded, size:', response.data.size, 'bytes');
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', reportName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('Download completed');
    } catch (error) {
      console.error('Error downloading report:', error.response?.data || error.message);
      alert('Error downloading report: ' + (error.response?.data?.error || error.message));
    }
  };

  const generateTestReport = async () => {
    console.log('Generating test report...');
    setGeneratingTest(true);
    try {
      const response = await axios.post('/api/reports/generate-test');
      console.log('Test report created:', response.data.reportName);
      // Refresh reports list
      await fetchReports();
      alert('Test report generated successfully!');
    } catch (error) {
      console.error('Error generating test report:', error.response?.data || error.message);
      alert('Error generating test report: ' + (error.response?.data?.error || error.message));
    } finally {
      setGeneratingTest(false);
    }
  };

  const getScanTypeBadgeStyle = (scanType) => {
    const colors = SCAN_TYPE_COLORS[scanType] || { bg: '#f5f5f5', color: '#616161' };
    return {
      background: colors.bg,
      color: colors.color,
    };
  };

  if (loading) {
    return <div className="reports"><p>Loading reports...</p></div>;
  }

  return (
    <div className="reports">
      {/* <div className="reports-header">
        <h2>Scan Reports</h2>
        <button 
          onClick={generateTestReport} 
          disabled={generatingTest}
          className="generate-test-btn"
        >
          {generatingTest ? '⏳ Generating...' : '✨ Generate Test Report'}
        </button>
      </div> */}
      <div className="reports-grid">
        {reports.length === 0 ? (
          <div className="no-reports">
            <p>No reports found</p>
            <p className="hint">Run scans to generate reports</p>
          </div>
        ) : (
          reports.map((report, index) => (
            <div key={index} className="report-card">
              <div className="report-header">
                <h3>{report.displayName || report.name}</h3>
                {report.scanTypeLabel && (
                  <span
                    className="scan-type-badge"
                    style={getScanTypeBadgeStyle(report.scanType)}
                  >
                    {report.scanTypeLabel}
                  </span>
                )}
              </div>
              <div className="report-body">
                <p className="report-date">
                  {new Date(report.createdAt).toLocaleDateString()} {' '}
                  {new Date(report.createdAt).toLocaleTimeString()}
                </p>
                <p className="report-size">{(report.size / 1024).toFixed(2)} KB</p>
              </div>
              <div className="report-actions">
                <button
                  onClick={() => handleViewReport(report.name, report.displayName)}
                  className="action-btn view"
                  disabled={previewLoading}
                >
                  View
                </button>
                <button
                  onClick={() => handleDownload(report.name)}
                  className="action-btn download"
                >
                  Download
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report Preview Modal */}
      {showPreview && selectedReport && (
        <div className="preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h2>{selectedReport.displayName || selectedReport.name}</h2>
              <button 
                className="preview-close"
                onClick={() => setShowPreview(false)}
              >
                ✕
              </button>
            </div>
            <div className="preview-content">
              {previewLoading ? (
                <p>Loading report...</p>
              ) : (
                <iframe
                  srcDoc={selectedReport.content}
                  title={selectedReport.name}
                  className="preview-frame"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;

