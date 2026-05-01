#!/bin/bash

# ================== COLOR DEFINITIONS ==================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# ================== FUNCTIONS ==================

# ASCII Banner
print_banner() {
    clear
    echo -e "${CYAN}"
    cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        ███╗   ██╗███████╗████████╗██████╗ ███████╗        ║
║        ████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██╔════╝        ║
║        ██╔██╗ ██║█████╗     ██║   ██████╔╝█████╗          ║
║        ██║╚██╗██║██╔══╝     ██║   ██╔══██╗██╔══╝          ║
║        ██║ ╚████║███████╗   ██║   ██║  ██║███████╗        ║
║        ╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝        ║
║                                                            ║
║     Automated Nmap Reconnaissance & Vulnerability Toolkit  ║
║                         v2.0                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Spinner animation
spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while kill -0 $pid 2>/dev/null; do
        local temp=${spinstr#?}
        printf " ${CYAN}[%c]${NC} " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# Progress bar
progress_bar() {
    local current=$1
    local total=$2
    local width=40
    local percentage=$((current * 100 / total))
    local filled=$((current * width / total))
    
    printf "${GREEN}["
    printf "%-${width}s" | tr ' ' '='
    printf "]${NC} %d%%\r" "$percentage"
}

# Print colored status messages
status_msg() {
    echo -e "${GREEN}[✓]${NC} $1"
}

error_msg() {
    echo -e "${RED}[✗]${NC} $1"
}

info_msg() {
    echo -e "${BLUE}[i]${NC} $1"
}

warn_msg() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Display menu
show_menu() {
    echo ""
    echo -e "${MAGENTA}╔════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║      SELECT SCAN TYPE              ║${NC}"
    echo -e "${MAGENTA}╚════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}1.${NC} ${WHITE}Quick Scan${NC}              (Fast, Basic port scan)"
    echo -e "${YELLOW}2.${NC} ${WHITE}Full Scan${NC}              (Comprehensive scan)"
    echo -e "${YELLOW}3.${NC} ${WHITE}Stealth Scan${NC}           (Slow, IDS evasion)"
    echo -e "${YELLOW}4.${NC} ${WHITE}UDP Scan${NC}               (UDP port scanning)"
    echo -e "${YELLOW}5.${NC} ${WHITE}Vulnerability Scan${NC}     (Service detection + vulns)"
    echo -e "${YELLOW}6.${NC} ${WHITE}Web Scan${NC}               (Web-specific scanning)"
    echo -e "${YELLOW}7.${NC} ${WHITE}LAN Discovery${NC}          (Discover local network)"
    echo ""
}

# ================== MAIN SCRIPT ==================

print_banner
show_menu

read -p "$(echo -e ${CYAN}Choose Scan Type [1-7]: ${NC})" choice
read -p "$(echo -e ${CYAN}Enter Target IP / Domain: ${NC})" target

# Remove http/https if user enters URL
target=$(echo "$target" | sed 's|http://||; s|https://||; s|/||g')

date=$(date +"%Y-%m-%d_%H-%M-%S")
report="reports/report_$date.txt"
html_report="reports/report_$date.html"

# Validate input
if [ -z "$target" ]; then
    error_msg "Target cannot be empty!"
    exit 1
fi

# Generate HTML Report Header
generate_html_header() {
    cat > "$html_report" << 'EOFHTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NetRecon Report</title>
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
        .subtitle { 
            font-size: 1.1em; 
            opacity: 0.9;
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
        .info-box p { margin: 5px 0; }
        .scan-results { 
            background: #f5f7fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-x: auto;
            max-height: 600px;
            overflow-y: auto;
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
            <h1>🔍 NetRecon Report</h1>
            <p class="subtitle">Automated Network Reconnaissance & Vulnerability Assessment</p>
        </header>
        <div class="content">
            <div class="info-box">
                <label>📍 Target:</label>
                <p>TARGETHERE</p>
            </div>
            <div class="info-box">
                <label>📅 Scan Date & Time:</label>
                <p>DATEHERE</p>
            </div>
            <div class="info-box">
                <label>🔧 Scan Type:</label>
                <p>SCANTYPEHERE</p>
            </div>
            <div class="info-box">
                <label>📊 Scan Results:</label>
            </div>
            <div class="scan-results">
RESULTSHERE
            </div>
        </div>
        <footer>
            <p>Generated by NetRecon v2.0 | <strong>Stay Ethical. Report Responsibly.</strong></p>
        </footer>
    </div>
</body>
</html>
EOFHTML
}

# Generate TXT Report Header
generate_txt_header() {
    {
        echo "╔═══════════════════════════════════════════════════════════╗"
        echo "║              NetRecon - Scan Report                      ║"
        echo "╚═══════════════════════════════════════════════════════════╝"
        echo ""
        echo "Target: $target"
        echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "Scan Type: $scan_type"
        echo ""
        echo "═══════════════════════════════════════════════════════════"
        echo ""
    } > $report
}

info_msg "Starting Scan on $target"
status_msg "Report will be saved to: $report (TXT) and $html_report (HTML)"
echo ""

if [ "$choice" == "1" ]; then
    scan_type="Quick Scan (Fast Port Scan)"
    
    generate_txt_header
    generate_html_header
    
    info_msg "Running: Host Discovery..."
    echo "[1] Host Discovery" >> $report
    nmap -sn $target >> $report 2>&1
    status_msg "Host discovery completed"
    
    echo "" >> $report
    info_msg "Running: Fast Port Scan..."
    echo "[2] Fast Port Scan" >> $report
    nmap -F $target >> $report 2>&1
    status_msg "Port scan completed"

elif [ "$choice" == "2" ]; then
    scan_type="Full Scan (Comprehensive)"
    
    generate_txt_header
    generate_html_header
    
    info_msg "Running: Host Discovery..."
    echo "[1] Host Discovery" >> $report
    nmap -sn $target >> $report 2>&1
    status_msg "Host discovery completed"

    echo "" >> $report
    info_msg "Running: Full Port Scan..."
    echo "[2] Full Port Scan" >> $report
    nmap -p- $target >> $report 2>&1
    status_msg "Full port scan completed"

    echo "" >> $report
    info_msg "Running: Service Detection..."
    echo "[3] Service Detection" >> $report
    nmap -sV -T4 $target >> $report 2>&1
    status_msg "Service detection completed"

    echo "" >> $report
    info_msg "Running: OS Detection..."
    echo "[4] OS Detection" >> $report
    sudo nmap -O -T4 $target >> $report 2>&1
    status_msg "OS detection completed"

elif [ "$choice" == "3" ]; then
    scan_type="Stealth Scan (IDS Evasion)"
    
    generate_txt_header
    generate_html_header
    
    info_msg "Running: Stealth Scan (Slow Timing)..."
    echo "[1] Stealth Port Scan" >> $report
    nmap -sS -T1 --scan-delay 1s $target >> $report 2>&1
    status_msg "Stealth scan completed"

elif [ "$choice" == "4" ]; then
    scan_type="UDP Scan"
    
    generate_txt_header
    generate_html_header
    
    info_msg "Running: UDP Port Scan..."
    echo "[1] UDP Port Scan" >> $report
    sudo nmap -sU -p- $target >> $report 2>&1
    status_msg "UDP scan completed"

elif [ "$choice" == "5" ]; then
    scan_type="Vulnerability Scan"
    
    generate_txt_header
    generate_html_header
    
    info_msg "Running: Service Detection for Vulnerabilities..."
    echo "[1] Service Detection" >> $report
    nmap -sV -sC $target >> $report 2>&1
    status_msg "Vulnerability assessment completed"

elif [ "$choice" == "6" ]; then
    scan_type="Web Scan"
    
    generate_txt_header
    generate_html_header
    
    info_msg "Running: Web Service Scanning..."
    echo "[1] Web Service Detection" >> $report
    nmap -p 80,443,8080,8443,3000 -sV -sC $target >> $report 2>&1
    status_msg "Web scan completed"

elif [ "$choice" == "7" ]; then
    scan_type="LAN Discovery"
    
    generate_txt_header
    generate_html_header
    
    info_msg "Running: LAN Discovery..."
    echo "[1] Local Network Discovery" >> $report
    nmap -sn $target >> $report 2>&1
    status_msg "LAN discovery completed"

else
    error_msg "Invalid Choice!"
    exit 1
fi

# Update HTML report with results
{
    echo "===== Scan Results ====="
    cat $report
} | tail -n +5 > /tmp/scan_results.txt

# Replace placeholders in HTML file
sed -i "s|TARGETHERE|$target|g" "$html_report"
sed -i "s|DATEHERE|$(date '+%Y-%m-%d %H:%M:%S')|g" "$html_report"
sed -i "s|SCANTYPEHERE|$scan_type|g" "$html_report"
sed -i "/RESULTSHERE/r /tmp/scan_results.txt" "$html_report"
sed -i "/RESULTSHERE/d" "$html_report"

echo ""
status_msg "Scan Completed Successfully!"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}📄 Text Report:  ${CYAN}$report${NC}"
echo -e "${WHITE}🌐 HTML Report:  ${CYAN}$html_report${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"