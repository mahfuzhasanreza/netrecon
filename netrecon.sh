#!/bin/bash

echo " NetRecon - Automated Nmap Toolkit "
echo ""

echo "1. Quick Scan (Fast, Basic port scan)"
echo "2. Full Scan (Slow, Comprehensive scan)"
echo "3. Stealth Scan (Slow)"
echo "4. UDP Scan (UDP port scanning)"
echo "5. Vulnerability Scan (Service detection + vulns)"
echo "6. Web Scan (Web-specific scanning)"
echo "7. LAN Discovery (Discover local network)"
echo "8. Metasploit Vulnerability Analysis"
echo "9. Exploit Suggestion Engine"
echo ""

read -p "Choose Scan Type [1-9]: " choice
read -p "Enter Target IP / Domain: " target

# Remove http/https if user enters URL
target=$(echo "$target" | sed 's|http://||; s|https://||; s|/||g')

date=$(date +"%Y-%m-%d_%H-%M-%S")
report="reports/report_$date.txt"

echo ""
echo "Starting Scan on $target ..."
echo "Saving Report: $report"
echo ""

echo "===== NetRecon Report =====" > $report
echo "Target: $target" >> $report
echo "Date: $(date)" >> $report
echo "" >> $report

if [ "$choice" == "1" ]; then
    scan_type="Quick Scan (Fast Port Scan)"
    
    echo "[1] Host Discovery" >> $report
    nmap -sn $target >> $report 2>&1
    
    echo "" >> $report
    echo "[2] Fast Port Scan" >> $report
    nmap -F $target >> $report 2>&1

elif [ "$choice" == "2" ]; then
    scan_type="Full Scan (Comprehensive)"
    
    echo "[1] Host Discovery" >> $report
    nmap -sn $target >> $report 2>&1

    echo "" >> $report
    echo "[2] Full Port Scan" >> $report
    nmap -p- $target >> $report 2>&1

    echo "" >> $report
    echo "[3] Service Detection" >> $report
    nmap -sV -T4 $target >> $report 2>&1

    echo "" >> $report
    echo "[4] OS Detection" >> $report
    sudo nmap -O -T4 $target >> $report 2>&1

elif [ "$choice" == "3" ]; then
    scan_type="Stealth Scan (Slow)"
    
    echo "[1] Stealth Port Scan" >> $report
    nmap -sS -T1 --scan-delay 1s $target >> $report 2>&1

elif [ "$choice" == "4" ]; then
    scan_type="UDP Scan"
    
    echo "[1] UDP Port Scan" >> $report
    sudo nmap -sU -p- $target >> $report 2>&1

elif [ "$choice" == "5" ]; then
    scan_type="Vulnerability Scan"
    
    echo "[1] Service Detection" >> $report
    nmap -sV -sC $target >> $report 2>&1

elif [ "$choice" == "6" ]; then
    scan_type="Web Scan"
    
    echo "[1] Web Service Detection" >> $report
    nmap -p 80,443,8080,8443,3000 -sV -sC $target >> $report 2>&1

elif [ "$choice" == "7" ]; then
    scan_type="LAN Discovery"
    
    echo "[1] Local Network Discovery" >> $report
    nmap -sn $target >> $report 2>&1

elif [ "$choice" == "8" ]; then
    scan_type="Metasploit Analysis Mode"
    bash modules/msf_analysis.sh "$target"

elif [ "$choice" == "9" ]; then
    bash modules/exploit_suggest.sh "$target"

else
    error_msg "Invalid Choice!"
    exit 1
fi

echo ""
echo "Scan Completed!"
echo "Report Saved: $report"