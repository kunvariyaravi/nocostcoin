# Contributing to Nocostcoin

Thank you for your interest in contributing to the Machine Economy!

## Development Setup

1. **Prerequisites**:
   - Rust (latest stable)
   - Node.js (v20+)
   - Docker & Docker Compose

2. **Core Setup**:
   ```bash
   cd core
   cargo build
   cargo test
   ```

3. **UI Setup**:
   ```bash
   cd ui
   npm install
   npm run dev
   ```

## Pull Request Process

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Coding Standards

- **Rust**: Use `cargo fmt` and `cargo clippy` before submitting.
- **TypeScript**: Ensure `npm run lint` passes.
- **Testing**: Add tests for new features.

## Architecture

- `core/`: Rust blockchain node (P2P, Consensus, State)
- `ui/`: Next.js frontend (Explorer, Wallet, Dashboard)
