const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Middleware to verify authentication via session
const authenticate = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Get all reports
router.get('/', authenticate, async (req, res) => {
  try {
    const reportsDir = path.join(process.cwd(), 'reports');
    
    try {
      const files = await fs.readdir(reportsDir);

      const reports = await Promise.all(
        files
          .filter((file) => file.endsWith('.html'))
          .map(async (file) => {
            const filePath = path.join(reportsDir, file);
            const stats = await fs.stat(filePath);
            return {
              name: file,
              path: `/reports/${file}`,
              size: stats.size,
              createdAt: stats.birthtime,
            };
          })
      );

      // Sort by creation time, newest first
      reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json(reports);
    } catch (dirError) {
      // If directory doesn't exist, create it and return empty array
      if (dirError.code === 'ENOENT') {
        await fs.mkdir(reportsDir, { recursive: true });
        res.json([]);
      } else {
        throw dirError;
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download report (must be before GET /:id to avoid route conflict)
router.get('/download/:id', authenticate, async (req, res) => {
  try {
    const reportPath = path.join(process.cwd(), 'reports', req.params.id);
    
    // Security: prevent directory traversal
    if (!reportPath.startsWith(path.join(process.cwd(), 'reports'))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.download(reportPath, req.params.id, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(404).json({ error: 'Report not found' });
        }
      }
    });
  } catch (error) {
    console.error('Error downloading report:', error);
    if (!res.headersSent) {
      res.status(404).json({ error: 'Report not found' });
    }
  }
});

// Get report content (view in browser)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const reportPath = path.join(process.cwd(), 'reports', req.params.id);
    
    // Security: prevent directory traversal
    if (!reportPath.startsWith(path.join(process.cwd(), 'reports'))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const content = await fs.readFile(reportPath, 'utf8');
    res.type('text/html').send(content);
  } catch (error) {
    console.error('Error reading report:', error);
    res.status(404).json({ error: 'Report not found' });
  }
});

// Generate test report (for demonstration)
router.post('/generate-test', authenticate, async (req, res) => {
  try {
    const reportsDir = path.join(process.cwd(), 'reports');
    await fs.mkdir(reportsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = `test-report-${timestamp}.html`;
    const reportPath = path.join(reportsDir, reportFile);

    const testHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NetRecon Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        .info-box { 
            background: #f5f7fa; 
            border-left: 4px solid #667eea; 
            padding: 20px; 
            margin-bottom: 30px; 
            border-radius: 8px;
        }
        .info-box label { 
            color: #667eea; 
            font-weight: bold; 
            display: block; 
            margin-bottom: 5px;
        }
        .scan-results { 
            background: #f5f7fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
        }
        footer { 
            background: #f5f7fa; 
            padding: 20px; 
            text-align: center; 
            color: #666; 
            border-top: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🔍 NetRecon Test Report</h1>
            <p>Network Reconnaissance & Vulnerability Assessment</p>
        </header>
        <div class="content">
            <div class="info-box">
                <label>📍 Target:</label>
                <p>test-host (192.168.1.100)</p>
            </div>
            <div class="info-box">
                <label>📅 Scan Date & Time:</label>
                <p>${new Date().toLocaleString()}</p>
            </div>
            <div class="info-box">
                <label>🔧 Scan Type:</label>
                <p>Quick Scan</p>
            </div>
            <div class="info-box">
                <label>📊 Scan Results:</label>
            </div>
            <div class="scan-results">
Starting Nmap 7.92 ( https://nmap.org ) at ${new Date().toLocaleString()}
Nmap scan report for test-host (192.168.1.100)
Host is up (0.042s latency).

PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
443/tcp  open  https
3000/tcp open  http-alt

Nmap done at ${new Date().toLocaleString()} -- 1 IP address (1 host up) scanned in 12.34 seconds
            </div>
        </div>
        <footer>
            <p>Generated by NetRecon v2.0 | <strong>Stay Ethical. Report Responsibly.</strong></p>
        </footer>
    </div>
</body>
</html>`;

    await fs.writeFile(reportPath, testHtmlContent);
    
    console.log(`✅ Test report generated: ${reportFile}`);

    res.status(201).json({
      message: 'Test report generated successfully',
      reportName: reportFile,
      path: `/reports/${reportFile}`,
    });
  } catch (error) {
    console.error('❌ Error generating test report:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
