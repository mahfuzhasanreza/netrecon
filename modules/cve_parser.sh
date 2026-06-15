#!/bin/bash

FILE=$1

echo "[+] Extracting CVEs..."

grep -oE "CVE-[0-9]{4}-[0-9]+" "$FILE" | sort | uniq