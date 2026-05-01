#!/bin/bash

clear
echo "==================================="
echo " NetRecon - Automated Nmap Toolkit "
echo "==================================="

echo "1. Quick Scan (Fast)"
echo "2. Full Scan (Slow but detailed)"
echo ""

read -p "Choose Scan Type [1-2]: " choice
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
    echo "[Quick Scan Selected]" | tee -a $report
    
    echo "" >> $report
    echo "[1] Host Discovery..." | tee -a $report
    nmap -sn $target >> $report

    echo "" >> $report
    echo "[2] Fast Port Scan..." | tee -a $report
    nmap -F $target >> $report

elif [ "$choice" == "2" ]; then
    echo "[Full Scan Selected]" | tee -a $report
    
    echo "" >> $report
    echo "[1] Host Discovery..." | tee -a $report
    nmap -sn $target >> $report

    echo "" >> $report
    echo "[2] Full Port Scan..." | tee -a $report
    nmap -p- $target >> $report

    echo "" >> $report
    echo "[3] Service Detection..." | tee -a $report
    nmap -sV -T4 $target >> $report

    echo "" >> $report
    echo "[4] OS Detection..." | tee -a $report
    sudo nmap -O -T4 $target >> $report

else
    echo "Invalid Choice!"
    exit 1
fi

echo ""
echo "Scan Completed!"
echo "Report Saved: $report"