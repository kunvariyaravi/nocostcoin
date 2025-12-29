# Build Stage
FROM rust:1.75 as builder

WORKDIR /usr/src/nocostcoin

# Install build dependencies for RocksDB
RUN apt-get update && apt-get install -y clang cmake

COPY . .

# Build release binary
RUN cargo build --release

# Runtime Stage
FROM debian:bookworm-slim

WORKDIR /usr/local/bin

# Copy binary from builder
COPY --from=builder /usr/src/nocostcoin/target/release/nocostcoin .

# Install dependencies (OpenSSL usually needed)
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

# Expose ports (P2P and API)
EXPOSE 9000 8000

# Set entrypoint
ENTRYPOINT ["./nocostcoin"]
