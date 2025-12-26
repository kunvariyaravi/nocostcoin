#!/bin/bash
# Nocostcoin Testnet Launcher (Linux/macOS)
# Launches a 3-node Testnet in separate terminal windows

echo "=== Nocostcoin Testnet Launcher ==="
echo ""

# Check if project is built
if [ ! -f "./core/target/release/nocostcoin" ]; then
    echo "Building project..."
    cd core && cargo build --release && cd ..
    if [ $? -ne 0 ]; then
        echo "Build failed! Please fix errors and try again."
        exit 1
    fi
fi

echo "Launching 3-node Testnet..."
echo ""

# Detect terminal emulator
if command -v gnome-terminal &> /dev/null; then
    TERM_CMD="gnome-terminal --"
elif command -v xterm &> /dev/null; then
    TERM_CMD="xterm -e"
elif command -v konsole &> /dev/null; then
    TERM_CMD="konsole -e"
else
    echo "No supported terminal emulator found. Please run nodes manually."
    exit 1
fi

# Launch Node 1 (Bootstrap)
echo "Starting Node 1 (Bootstrap) on port 9000..."
$TERM_CMD bash -c "echo 'Node 1 - Bootstrap (Port 9000)'; cd core; cargo run --release -- --port 9000; exec bash" &

# Wait for bootstrap node to start
sleep 3

# Launch Node 2
echo "Starting Node 2 (Validator) on port 9001..."
$TERM_CMD bash -c "echo 'Node 2 - Validator (Port 9001)'; cd core; cargo run --release -- --port 9001 --bootstrap /ip4/127.0.0.1/tcp/9000; exec bash" &

# Wait a bit
sleep 2

# Launch Node 3
echo "Starting Node 3 (Validator) on port 9002..."
$TERM_CMD bash -c "echo 'Node 3 - Validator (Port 9002)'; cd core; cargo run --release -- --port 9002 --bootstrap /ip4/127.0.0.1/tcp/9000; exec bash" &

echo ""
echo "=== Testnet Launched! ==="
echo ""
echo "Three terminal windows have been opened with:"
echo "  - Node 1 (Bootstrap): Port 9000"
echo "  - Node 2 (Validator): Port 9001"
echo "  - Node 3 (Validator): Port 9002"
echo ""
echo "Available Commands (in each node window):"
echo "  info  - Show node status"
echo "  sim   - Toggle automatic transaction generation"
echo "  send random <amount> - Send tokens to random address"
echo "  help  - Show all commands"
echo ""
echo "To stop the Testnet: Close all node windows or press Ctrl+C in each"
echo ""

