const fs = require('fs').promises;
const path = require('path');

/**
 * Generate HTML report from scan data
 * @param {Object} scan - Scan document from MongoDB
 * @returns {Promise<string>} Path to generated report
 */
async function generateScanReport(scan) {
  try {
    const reportsDir = path.join(process.cwd(), 'reports');
    await fs.mkdir(reportsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = `scan_${scan._id.toString()}_${timestamp}.html`;
    const reportPath = path.join(reportsDir, reportFile);

    const scanDate = new Date(scan.startTime).toLocaleString();
    const endDate = new Date(scan.endTime).toLocaleString();
    const openPorts = scan.ports.open.join(', ') || 'None';
    const closedPorts = scan.ports.closed.length > 0 ? scan.ports.closed.slice(0, 10).join(', ') + (scan.ports.closed.length > 10 ? '...' : '') : 'None';
    const filteredPorts = scan.ports.filtered.length > 0 ? scan.ports.filtered.slice(0, 10).join(', ') + (scan.ports.filtered.length > 10 ? '...' : '') : 'None';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NetRecon Scan Report - ${scan.target}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #FF4D00 0%, #FF4D00 100%);
            color: #333;
            padding: 20px;
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        header { 
            background: linear-gradient(135deg, #FF4D00 0%, #FF4D00 100%);
            color: white; 
            padding: 40px; 
            text-align: center;
        }
        h1 { 
            font-size: 2.5em; 
            margin-bottom: 10px; 
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .content { padding: 40px; }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .info-box { 
            background: #f5f7fa; 
            border-left: 4px solid #FF4D00; 
            padding: 20px; 
            border-radius: 8px;
        }
        .info-box label { 
            color: #FF4D00; 
            font-weight: bold; 
            display: block; 
            margin-bottom: 8px;
            font-size: 0.9em;
            text-transform: uppercase;
        }
        .info-box .value {
            color: #333;
            font-size: 1.1em;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9em;
        }
        .status-completed {
            background: rgba(81, 207, 102, 0.2);
            color: #51cf66;
        }
        .status-failed {
            background: rgba(255, 107, 107, 0.2);
            color: #ff6b6b;
        }
        .ports-section {
            background: #f5f7fa;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .ports-section h3 {
            color: #FF4D00;
            margin-bottom: 15px;
        }
        .port-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .port-group {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border-left: 3px solid #FF4D00;
        }
        .port-group-title {
            color: #FF4D00;
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 0.9em;
        }
        .port-group-content {
            color: #555;
            word-wrap: break-word;
            font-size: 0.9em;
        }
        .nmap-output {
            background: #f5f7fa;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-x: auto;
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #ddd;
        }
        .nmap-title {
            color: #FF4D00;
            font-weight: bold;
            margin-bottom: 15px;
        }
        footer { 
            background: #f5f7fa; 
            padding: 20px; 
            text-align: center; 
            color: #666; 
            border-top: 1px solid #ddd;
        }
        @media (max-width: 768px) {
            header { padding: 20px; }
            h1 { font-size: 1.8em; }
            .content { padding: 20px; }
            .info-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>NetRecon Scan Report</h1>
            <p>Network Reconnaissance & Vulnerability Assessment</p>
        </header>
        <div class="content">
            <div class="info-grid">
                <div class="info-box">
                    <label>Target</label>
                    <div class="value">${escapeHtml(scan.target)}</div>
                </div>
                <div class="info-box">
                    <label>Scan Type</label>
                    <div class="value">${capitalize(scan.scanType)}</div>
                </div>
                <div class="info-box">
                    <label>Status</label>
                    <span class="status-badge status-${scan.status}">${capitalize(scan.status)}</span>
                </div>
                <div class="info-box">
                    <label>Duration</label>
                    <div class="value">${scan.duration}s</div>
                </div>
                <div class="info-box">
                    <label>Started</label>
                    <div class="value">${scanDate}</div>
                </div>
                <div class="info-box">
                    <label>Ended</label>
                    <div class="value">${endDate}</div>
                </div>
            </div>

            ${scan.notes ? `
            <div class="info-box">
                <label>Notes</label>
                <div class="value">${escapeHtml(scan.notes)}</div>
            </div>
            ` : ''}

            ${scan.tags && scan.tags.length > 0 ? `
            <div class="info-box">
                <label>Tags</label>
                <div class="value">${scan.tags.map(tag => escapeHtml(tag)).join(', ')}</div>
            </div>
            ` : ''}

            <div class="ports-section">
                <h3>Port Analysis</h3>
                <div class="port-list">
                    <div class="port-group">
                        <div class="port-group-title">Open Ports (${scan.ports.open.length})</div>
                        <div class="port-group-content">${openPorts}</div>
                    </div>
                    <div class="port-group">
                        <div class="port-group-title">Closed Ports (${scan.ports.closed.length})</div>
                        <div class="port-group-content">${closedPorts}</div>
                    </div>
                    <div class="port-group">
                        <div class="port-group-title">Filtered Ports (${scan.ports.filtered.length})</div>
                        <div class="port-group-content">${filteredPorts}</div>
                    </div>
                </div>
            </div>

            ${scan.results && scan.results.hostDiscovery ? `
            <div class="nmap-output">
                <div class="nmap-title">Host Discovery Results</div>
                ${escapeHtml(scan.results.hostDiscovery)}
            </div>
            ` : ''}

            ${scan.results && scan.results.portScan ? `
            <div class="nmap-output">
                <div class="nmap-title">Port Scan Results</div>
                ${escapeHtml(scan.results.portScan)}
            </div>
            ` : ''}

            ${scan.results && scan.results.serviceDetection ? `
            <div class="nmap-output">
                <div class="nmap-title">Service Detection Results</div>
                ${escapeHtml(scan.results.serviceDetection)}
            </div>
            ` : ''}

            ${scan.results && scan.results.osDetection ? `
            <div class="nmap-output">
                <div class="nmap-title">OS Detection Results</div>
                ${escapeHtml(scan.results.osDetection)}
            </div>
            ` : ''}

            ${scan.results && scan.results.error ? `
            <div class="nmap-output" style="border-left: 4px solid #ff6b6b;">
                <div class="nmap-title" style="color: #ff6b6b;">Error Details</div>
                ${escapeHtml(scan.results.error)}
            </div>
            ` : ''}
        </div>
        <footer>
            <p>Generated by NetRecon v2.0 | Report ID: ${scan._id.toString()}</p>
            <p><strong>Stay Ethical. Report Responsibly. Scan Only With Authorization.</strong></p>
        </footer>
    </div>
</body>
</html>`;

    await fs.writeFile(reportPath, htmlContent);
    console.log(`Report generated: ${reportFile}`);
    
    return `/reports/${reportFile}`;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace('-', ' ');
}

module.exports = { generateScanReport };
