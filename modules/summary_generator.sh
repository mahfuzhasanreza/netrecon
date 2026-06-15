#!/bin/bash

FILE=$1

echo ""
echo "=========== SUMMARY ==========="
echo "Open Ports: $(grep -E 'tcp.*open' "$FILE" | wc -l)"
echo "CVE Found: $(grep -c CVE "$FILE")"
echo "Services Detected:"
grep "tcp" "$FILE" | awk '{print $1,$3}' | head -5
echo "==============================="