# Optimized Dockerfile for Render.com (512MB RAM limit)
# Multi-stage build to reduce image size

# Build Stage
FROM rust:1.75-slim as builder

WORKDIR /app

# Copy manifests
COPY core/Cargo.toml core/Cargo.lock ./

# Create dummy main.rs to cache dependencies
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy actual source code
COPY core/src ./src

# Install build dependencies for RocksDB
RUN apt-get update && apt-get install -y --no-install-recommends \
    clang \
    cmake \
    libssl-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Build release binary with optimizations
RUN cargo build --release

# Runtime Stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/nocostcoin /usr/local/bin/nocostcoin

# Create data directory
RUN mkdir -p /app/data

# Expose ports
EXPOSE 9000 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/stats || exit 1

# Run with minimal memory settings
ENV RUST_LOG=info
ENV MALLOC_CONF=background_thread:true,metadata_thp:auto,dirty_decay_ms:30000,muzzy_decay_ms:30000

# Start node
ENTRYPOINT ["nocostcoin"]
CMD ["--port", "9000", "--mining", "true"]
