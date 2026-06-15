GREEN="\e[32m"
RED="\e[31m"
YELLOW="\e[33m"
BLUE="\e[34m"
NC="\e[0m"

print_header() {
    echo -e "${BLUE}"
    echo "==================================="
    echo "      NetRecon PRO LEVEL 3"
    echo "==================================="
    echo -e "${NC}"
}

loading() {
    echo -n "Scanning"
    for i in {1..5}; do
        echo -n "."
        sleep 0.3
    done
    echo ""
}