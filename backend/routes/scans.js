const express = require('express');
const router = express.Router();
const Scan = require('../models/Scan');
const { generateScanReport } = require('../utils/reportGenerator');
const { exec } = require('child_process');
const path = require('path');

// Middleware to verify authentication via session
const authenticate = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Get all scans for user
router.get('/', authenticate, async (req, res) => {
  try {
    const scans = await Scan.find({ userId: req.session.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(scans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get scan statistics (must be before /:id to avoid route conflict)
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const totalScans = await Scan.countDocuments({ userId: req.session.userId });
    const completedScans = await Scan.countDocuments({
      userId: req.session.userId,
      status: 'completed',
    });
    const failedScans = await Scan.countDocuments({
      userId: req.session.userId,
      status: 'failed',
    });

    res.json({
      totalScans,
      completedScans,
      failedScans,
      successRate: totalScans > 0 ? (completedScans / totalScans) * 100 : 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get scan by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    // Verify user owns this scan
    if (scan.userId.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json(scan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new scan
router.post('/', authenticate, async (req, res) => {
  try {
    const { target, scanType } = req.body;

    if (!target || !scanType) {
      return res.status(400).json({ error: 'Target and scanType required' });
    }

    const scan = new Scan({
      userId: req.session.userId,
      target,
      scanType,
      status: 'pending',
      startTime: new Date(),
    });

    await scan.save();

    // Execute nmap scan asynchronously
    executeNmapScan(scan);

    res.status(201).json({
      message: 'Scan initiated',
      scan,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create test scan (define before other POST routes to avoid conflicts)
router.post('/test-scan', authenticate, async (req, res) => {
  try {
    const testScan = new Scan({
      userId: req.session.userId,
      target: 'test-host (192.168.1.100)',
      scanType: 'quick',
      status: 'completed',
      startTime: new Date(Date.now() - 30000),
      endTime: new Date(),
      duration: 30,
      results: {
        output: `Starting Nmap 7.92 ( https://nmap.org ) at ${new Date().toLocaleString()}\nNmap scan report for test-host (192.168.1.100)\nHost is up (0.042s latency).\n\nPORT     STATE SERVICE\n22/tcp   open  ssh\n80/tcp   open  http\n443/tcp  open  https\n3000/tcp open  http-alt\n\nNmap done -- 1 IP address (1 host up) scanned in 30 seconds`,
      },
      ports: {
        open: [22, 80, 443, 3000],
        closed: [],
        filtered: [],
      },
      threats: {
        critical: 0,
        high: 1,
        medium: 2,
        low: 1,
      },
    });

    await testScan.save();

    res.status(201).json({
      message: 'Test scan created successfully',
      scan: testScan,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to execute command with promise
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error && !stdout) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Execute nmap scan based on type
async function executeNmapScan(scan) {
  try {
    scan.status = 'running';
    await scan.save();

    let allResults = {
      hostDiscovery: '',
      portScan: '',
      serviceDetection: '',
      osDetection: '',
    };

    try {
      // Run different nmap commands based on scan type
      switch (scan.scanType) {
        case 'quick':
          // Quick: Host Discovery + Fast Port Scan
          console.log(`[Quick Scan] Running host discovery...`);
          allResults.hostDiscovery = await executeCommand(`nmap -sn ${scan.target}`);
          console.log(`[Quick Scan] Running fast port scan...`);
          allResults.portScan = await executeCommand(`nmap -F ${scan.target}`);
          break;

        case 'full':
          // Full: Host Discovery + Full Port Scan + Service Detection + OS Detection
          console.log(`[Full Scan] Running host discovery...`);
          allResults.hostDiscovery = await executeCommand(`nmap -sn ${scan.target}`);
          console.log(`[Full Scan] Running full port scan...`);
          allResults.portScan = await executeCommand(`nmap -p- ${scan.target}`);
          console.log(`[Full Scan] Running service detection...`);
          allResults.serviceDetection = await executeCommand(`nmap -sV -T4 ${scan.target}`);
          console.log(`[Full Scan] Running OS detection...`);
          allResults.osDetection = await executeCommand(`sudo nmap -O -T4 ${scan.target}`);
          break;

        case 'stealth':
          // Stealth: Stealth port scan
          console.log(`[Stealth Scan] Running stealth scan...`);
          allResults.portScan = await executeCommand(`nmap -sS -T1 --scan-delay 1s ${scan.target}`);
          break;

        case 'udp':
          // UDP: UDP port scan
          console.log(`[UDP Scan] Running UDP port scan...`);
          allResults.portScan = await executeCommand(`sudo nmap -sU -p- ${scan.target}`);
          break;

        case 'vulnerability':
          // Vulnerability: Service detection with NSE scripts
          console.log(`[Vulnerability Scan] Running vulnerability assessment...`);
          allResults.serviceDetection = await executeCommand(`nmap -sV -sC ${scan.target}`);
          break;

        case 'web':
          // Web: Specific web ports with service detection
          console.log(`[Web Scan] Running web service scan...`);
          allResults.portScan = await executeCommand(
            `nmap -p 80,443,8080,8443,3000 -sV -sC ${scan.target}`
          );
          break;

        case 'lan-discovery':
          // LAN Discovery: Host discovery only
          console.log(`[LAN Discovery] Discovering local network...`);
          allResults.hostDiscovery = await executeCommand(`nmap -sn ${scan.target}`);
          break;

        case 'msf-vulnerability':
          // Metasploit Vulnerability Analysis
          console.log(`[MSF Vulnerability] Running Metasploit vulnerability analysis...`);
          const projectRoot = path.resolve(__dirname, '..', '..');
          
          // Step 1: Run nmap with vuln scripts and XML output
          const msfDate = new Date().toISOString().replace(/[:.]/g, '-');
          const xmlExport = path.join(projectRoot, 'exports', `msf_${msfDate}.xml`);
          
          // Ensure exports directory exists
          await executeCommand(`mkdir -p ${path.join(projectRoot, 'exports')}`);
          
          // Run vulnerability scan with service/OS detection
          console.log(`[MSF Vulnerability] Running nmap -sV --script vuln...`);
          allResults.serviceDetection = await executeCommand(
            `nmap -sV --script vuln ${scan.target} -oX ${xmlExport}`
          );
          
          // Step 2: Try to import into Metasploit and get vuln data
          try {
            console.log(`[MSF Vulnerability] Importing into Metasploit...`);
            const msfOutput = await executeCommand(
              `msfconsole -q -x "db_import ${xmlExport}; services; vulns; exit" 2>&1`
            );
            allResults.msfAnalysis = msfOutput;
          } catch (msfErr) {
            allResults.msfAnalysis = `[!] Metasploit import skipped: ${msfErr.message}\n\nVulnerability scan results are available from nmap output above.`;
          }
          
          // Step 3: Risk assessment based on CVE count
          try {
            const cveMatches = (allResults.serviceDetection || '').match(/CVE-\d{4}-\d+/g);
            const cveList = cveMatches ? [...new Set(cveMatches)] : [];
            const cveCount = cveList.length;
            
            let riskLevel;
            if (cveCount >= 10) riskLevel = 'CRITICAL RISK';
            else if (cveCount >= 5) riskLevel = 'HIGH RISK';
            else if (cveCount >= 1) riskLevel = 'MEDIUM RISK';
            else riskLevel = 'LOW RISK';
            
            allResults.riskLevel = riskLevel;
            allResults.summary = `=========== SUMMARY ===========\nCVEs Found: ${cveCount}\n${cveList.length > 0 ? 'CVEs: ' + cveList.join(', ') : 'No CVEs detected'}\nRisk Level: ${riskLevel}\n===============================`;
          } catch (riskErr) {
            allResults.riskLevel = 'UNKNOWN';
            allResults.summary = 'Could not generate summary';
          }
          break;

        case 'msf-exploit':
          // Metasploit Exploit Suggestion Engine
          console.log(`[MSF Exploit] Running Exploit Suggestion Engine...`);
          
          // Step 1: Run nmap service + vuln scan
          console.log(`[MSF Exploit] Scanning target services...`);
          const exploitScanOutput = await executeCommand(
            `nmap -sV --script vuln ${scan.target}`
          );
          allResults.serviceDetection = exploitScanOutput;
          
          // Step 2: Extract detected services and suggest exploits
          let exploitSuggestions = '=========== DETECTED SERVICES ===========\n';
          const serviceLines = exploitScanOutput.split('\n').filter(l => /\d+\/tcp\s+open/.test(l));
          serviceLines.forEach(line => {
            exploitSuggestions += line.trim() + '\n';
          });
          
          exploitSuggestions += '\n=========== SUGGESTED EXPLOITS ===========\n';
          
          const scanLower = exploitScanOutput.toLowerCase();
          
          if (scanLower.includes('postgresql')) {
            exploitSuggestions += '[+] PostgreSQL detected\n';
            exploitSuggestions += '    → auxiliary/scanner/postgres/postgres_login\n';
            exploitSuggestions += '    → auxiliary/admin/postgres/postgres_sql\n\n';
          }
          if (scanLower.includes('ssh')) {
            exploitSuggestions += '[+] SSH detected\n';
            exploitSuggestions += '    → auxiliary/scanner/ssh/ssh_login\n';
            exploitSuggestions += '    → auxiliary/scanner/ssh/ssh_enumusers\n\n';
          }
          if (scanLower.includes('http')) {
            exploitSuggestions += '[+] HTTP/Web detected\n';
            exploitSuggestions += '    → auxiliary/scanner/http/http_version\n';
            exploitSuggestions += '    → auxiliary/scanner/http/dir_scanner\n\n';
          }
          if (scanLower.includes('ftp')) {
            exploitSuggestions += '[+] FTP detected\n';
            exploitSuggestions += '    → auxiliary/scanner/ftp/ftp_login\n';
            exploitSuggestions += '    → auxiliary/scanner/ftp/anonymous\n\n';
          }
          if (scanLower.includes('smtp') || scanLower.includes('mail')) {
            exploitSuggestions += '[+] SMTP/Mail detected\n';
            exploitSuggestions += '    → auxiliary/scanner/smtp/smtp_enum\n';
            exploitSuggestions += '    → auxiliary/scanner/smtp/smtp_version\n\n';
          }
          if (scanLower.includes('mysql')) {
            exploitSuggestions += '[+] MySQL detected\n';
            exploitSuggestions += '    → auxiliary/scanner/mysql/mysql_login\n';
            exploitSuggestions += '    → auxiliary/scanner/mysql/mysql_version\n\n';
          }
          if (scanLower.includes('smb') || scanLower.includes('microsoft-ds') || scanLower.includes('netbios')) {
            exploitSuggestions += '[+] SMB/NetBIOS detected\n';
            exploitSuggestions += '    → auxiliary/scanner/smb/smb_version\n';
            exploitSuggestions += '    → exploit/windows/smb/ms17_010_eternalblue\n\n';
          }
          if (scanLower.includes('rdp') || scanLower.includes('ms-wbt-server')) {
            exploitSuggestions += '[+] RDP detected\n';
            exploitSuggestions += '    → auxiliary/scanner/rdp/rdp_scanner\n';
            exploitSuggestions += '    → exploit/windows/rdp/cve_2019_0708_bluekeep\n\n';
          }
          if (scanLower.includes('cups')) {
            exploitSuggestions += '[+] CUPS detected\n';
            exploitSuggestions += '    → exploit/linux/remote/cups_filters\n\n';
          }
          if (scanLower.includes('tor')) {
            exploitSuggestions += '[+] TOR/Unknown service detected\n';
            exploitSuggestions += '    → manual analysis required\n\n';
          }
          
          allResults.msfExploit = exploitSuggestions;
          
          // Step 3: CVE check
          const exploitCveMatches = (exploitScanOutput).match(/CVE-\d{4}-\d+/g);
          const exploitCveList = exploitCveMatches ? [...new Set(exploitCveMatches)] : [];
          const exploitCveCount = exploitCveList.length;
          
          let exploitRisk;
          if (exploitCveCount >= 5) exploitRisk = 'CRITICAL';
          else if (exploitCveCount >= 2) exploitRisk = 'HIGH';
          else if (exploitCveCount >= 1) exploitRisk = 'MEDIUM';
          else exploitRisk = 'LOW';
          
          allResults.riskLevel = exploitRisk;
          allResults.summary = `=========== CVE CHECK ===========\n${exploitCveList.length > 0 ? exploitCveList.join('\n') : 'No CVEs found'}\n\n=========== RISK LEVEL ===========\n${exploitRisk}\n\nTotal CVEs: ${exploitCveCount}\nServices Detected: ${serviceLines.length}`;
          break;

        default:
          console.log(`[Default] Running quick scan...`);
          allResults.portScan = await executeCommand(`nmap -F ${scan.target}`);
      }

      // Fetch fresh scan from DB
      const updatedScan = await Scan.findById(scan._id);
      updatedScan.status = 'completed';
      updatedScan.results = allResults;
      updatedScan.endTime = new Date();
      updatedScan.duration = Math.round(
        (updatedScan.endTime - updatedScan.startTime) / 1000
      );

      // Parse all outputs to extract port information
      const allOutput = Object.values(allResults).join('\n');
      
      // Extract TCP open ports
      const tcpOpenMatches = allOutput.match(/(\d+)\/tcp\s+open/g);
      if (tcpOpenMatches) {
        updatedScan.ports.open = [
          ...new Set(tcpOpenMatches.map((p) => parseInt(p))),
        ];
      }

      // Extract TCP closed ports
      const tcpClosedMatches = allOutput.match(/(\d+)\/tcp\s+closed/g);
      if (tcpClosedMatches) {
        updatedScan.ports.closed = [
          ...new Set(tcpClosedMatches.map((p) => parseInt(p))),
        ];
      }

      // Extract TCP filtered ports
      const tcpFilteredMatches = allOutput.match(/(\d+)\/tcp\s+filtered/g);
      if (tcpFilteredMatches) {
        updatedScan.ports.filtered = [
          ...new Set(tcpFilteredMatches.map((p) => parseInt(p))),
        ];
      }

      // Generate HTML report
      try {
        const reportPath = await generateScanReport(updatedScan);
        updatedScan.reportPath = reportPath;
        console.log(`Report generated and stored: ${reportPath}`);
      } catch (reportError) {
        console.error('Warning: Could not generate report:', reportError.message);
        // Continue even if report generation fails
      }

      await updatedScan.save();
      console.log(`Scan completed: ${scan._id} - Status: ${updatedScan.status}`);
    } catch (execError) {
      // Fetch fresh scan from DB
      const updatedScan = await Scan.findById(scan._id);
      updatedScan.status = 'failed';
      updatedScan.results = {
        error: execError.message,
      };
      updatedScan.endTime = new Date();
      updatedScan.duration = Math.round(
        (updatedScan.endTime - updatedScan.startTime) / 1000
      );
      await updatedScan.save();
      console.error(`Scan failed: ${scan._id} - Error: ${execError.message}`);
    }
  } catch (error) {
    console.error('Error executing nmap:', error);
    try {
      await Scan.findByIdAndUpdate(scan._id, {
        status: 'failed',
        results: {
          error: error.message,
        },
      });
    } catch (updateError) {
      console.error('Error updating failed scan:', updateError);
    }
  }
}

// Update scan
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { notes, tags, isBookmarked } = req.body;
    const scan = await Scan.findById(req.params.id);
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    // Verify user owns this scan
    if (scan.userId.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const updatedScan = await Scan.findByIdAndUpdate(
      req.params.id,
      { notes, tags, isBookmarked },
      { new: true }
    );
    res.json(updatedScan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete scan
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    // Verify user owns this scan
    if (scan.userId.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await Scan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Scan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
