#!/bin/bash

FILE=$1

CVE_COUNT=$(grep -c "CVE" "$FILE")

if [ "$CVE_COUNT" -ge 10 ]; then
    echo "🔥 CRITICAL RISK"
elif [ "$CVE_COUNT" -ge 5 ]; then
    echo "🔴 HIGH RISK"
elif [ "$CVE_COUNT" -ge 1 ]; then
    echo "🟡 MEDIUM RISK"
else
    echo "🟢 LOW RISK"
fi