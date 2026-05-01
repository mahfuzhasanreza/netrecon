#!/bin/bash

clear
echo "==================================="
echo " NetRecon - Automated Nmap Toolkit "
echo "==================================="

read -p "Enter Target IP / Domain: " target

target=$(echo "$target" | sed 's|http://||; s|https://||; s|/||g')

date=$(date +"%Y-%m-%d_%H-%M-%S")
report="reports/report_$date.txt"

echo "Starting Scan on $target ..."
echo "Report File: $report"

echo "===== NetRecon Report =====" > $report
echo "Target: $target" >> $report
echo "Date: $(date)" >> $report
echo "" >> $report

# Host Discovery
echo "[1] Host Discovery..." | tee -a $report
nmap -sn $target >> $report

# Port Scan
echo "" >> $report
echo "[2] Port Scan..." | tee -a $report
nmap -F $target >> $report

# Service Detection
echo "" >> $report
echo "[3] Service Detection..." | tee -a $report
nmap -sV $target >> $report

# OS Detection
echo "" >> $report
echo "[4] OS Detection..." | tee -a $report
sudo nmap -O $target >> $report

echo ""
echo "Scan Completed!"
echo "Report Saved: $report"