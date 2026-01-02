# Build Stage
FROM rust:bookworm as builder

WORKDIR /usr/src/nocostcoin

# Install build dependencies for RocksDB
RUN apt-get update && apt-get install -y clang cmake

# Create empty project for caching dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
COPY Cargo.toml Cargo.lock ./

# Build dependencies (this layer is cached until Cargo.toml changes)
RUN cargo build --release

# Remove dummy build artifacts so actual source is compiled
RUN rm src/*.rs
RUN rm ./target/release/deps/nocostcoin*

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
