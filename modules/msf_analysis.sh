#!/bin/bash

TARGET=$1
DATE=$(date +"%Y%m%d_%H%M%S")

mkdir -p exports reports msf

XML="exports/msf_$DATE.xml"
REPORT="reports/msf_analysis_$DATE.txt"

echo "[+] Running MSF-ready scan..."

# Step 1: Nmap with vuln scripts
sudo nmap -sV -O --script vuln "$TARGET" -oX "$XML"

echo "[+] Scan Completed"
echo "[+] XML Saved: $XML"

# Step 2: Import into Metasploit DB
echo "[+] Importing into Metasploit..."

msfdb init > /dev/null 2>&1

msfconsole -q -x "
db_import $XML;
services;
vulns;
exit
" >> "$REPORT"

echo "[+] Metasploit Analysis Done"
echo "[+] Report: $REPORT"