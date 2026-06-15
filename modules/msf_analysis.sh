#!/bin/bash

TARGET=$1
DATE=$(date +"%Y%m%d_%H%M%S")

mkdir -p exports reports

XML="exports/msf_$DATE.xml"
REPORT="reports/msf_report_$DATE.txt"

source modules/ui.sh

print_header
loading

echo "[+] Running Vulnerability Scan..." | tee "$REPORT"

sudo nmap -sV -O --script vuln "$TARGET" -oX "$XML" >> "$REPORT" 2>&1

echo "" >> "$REPORT"
echo "========================" >> "$REPORT"
echo " METASPLOIT IMPORT " >> "$REPORT"
echo "========================" >> "$REPORT"

if command -v msfconsole >/dev/null; then
    msfdb init >/dev/null 2>&1

    msfconsole -q -x "
db_import $XML;
services;
vulns;
exit
" >> "$REPORT"
else
    echo "[!] Metasploit not installed" >> "$REPORT"
fi

echo "" >> "$REPORT"

# RISK ENGINE
bash modules/risk_engine.sh "$REPORT" >> "$REPORT"

# SUMMARY
bash modules/summary_generator.sh "$REPORT" >> "$REPORT"

echo ""
echo "✔ Report saved: $REPORT"