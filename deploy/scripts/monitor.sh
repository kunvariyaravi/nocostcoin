#!/bin/bash
# Nocostcoin Node Monitoring Script
# Usage: ./monitor.sh [interval_seconds]

INTERVAL=${1:-30}
API_URL="http://localhost:8000"
LOG_FILE="monitor.log"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Starting Nocostcoin Node Monitor (interval: ${INTERVAL}s)"
echo "Logs saved to: ${LOG_FILE}"
echo "Press Ctrl+C to stop"
echo "---"

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Fetch stats
    STATS=$(curl -s -m 5 ${API_URL}/stats 2>/dev/null)
    
    if [ $? -eq 0 ] && [ ! -z "$STATS" ]; then
        # Parse JSON using jq if available, otherwise use grep/sed
        if command -v jq &> /dev/null; then
            BLOCK=$(echo $STATS | jq -r '.block_height // "N/A"')
            PEERS=$(echo $STATS | jq -r '.peer_count // "N/A"')
            TXS=$(echo $STATS | jq -r '.total_transactions // "N/A"')
            MEMPOOL=$(echo $STATS | jq -r '.mempool_size // "N/A"')
        else
            BLOCK=$(echo $STATS | grep -oP '"block_height":\s*\K\d+' || echo "N/A")
            PEERS=$(echo $STATS | grep -oP '"peer_count":\s*\K\d+' || echo "N/A")
            TXS=$(echo $STATS | grep -oP '"total_transactions":\s*\K\d+' || echo "N/A")
            MEMPOOL=$(echo $STATS | grep -oP '"mempool_size":\s*\K\d+' || echo "N/A")
        fi
        
        # Color code based on status
        if [ "$PEERS" -eq 0 ] 2>/dev/null; then
            STATUS="${YELLOW}WARNING${NC}"
        else
            STATUS="${GREEN}HEALTHY${NC}"
        fi
        
        OUTPUT="[$TIMESTAMP] ${STATUS} | Block: $BLOCK | Peers: $PEERS | TXs: $TXS | Mempool: $MEMPOOL"
        echo -e "$OUTPUT"
        echo "[$TIMESTAMP] Block: $BLOCK | Peers: $PEERS | TXs: $TXS | Mempool: $MEMPOOL" >> $LOG_FILE
        
    else
        OUTPUT="[$TIMESTAMP] ${RED}NODE DOWN${NC} - API unreachable"
        echo -e "$OUTPUT"
        echo "[$TIMESTAMP] NODE DOWN - API unreachable" >> $LOG_FILE
    fi
    
    # Check disk space
    DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 80 ]; then
        echo -e "${RED}WARNING: Disk usage at ${DISK_USAGE}%${NC}"
    fi
    
    # Check memory if available
    if command -v free &> /dev/null; then
        MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
        if [ "$MEM_USAGE" -gt 90 ]; then
            echo -e "${RED}WARNING: Memory usage at ${MEM_USAGE}%${NC}"
        fi
    fi
    
    sleep $INTERVAL
done
