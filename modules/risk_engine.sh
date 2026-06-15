#!/bin/bash

FILE=$1

HIGH=$(grep -c "CVE" "$FILE")

if [ $HIGH -gt 10 ]; then
    echo "CRITICAL RISK"
elif [ $HIGH -gt 5 ]; then
    echo "HIGH RISK"
elif [ $HIGH -gt 1 ]; then
    echo "MEDIUM RISK"
else
    echo "LOW RISK"
fi