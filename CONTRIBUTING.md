# Universal Wallet Development Guide

## Quick Start Commands

### Install Dependencies
```bash
pnpm install
```

### Start Development
```bash
# Start both frontend and backend
pnpm dev

# Start individual services
pnpm --filter @universal/web dev          # Frontend only
cargo run -p universal-backend           # Backend only
```

### Build for Production
```bash
pnpm build
```

### Run Tests
```bash
# Backend tests
cargo test --manifest-path apps/backend/Cargo.toml

# Frontend tests (when implemented)
pnpm --filter @universal/web test
```

## Architecture Overview

See README.md for detailed architecture documentation.

## Contributing

1. Create a feature branch
2. Write tests for new functionality
3. Ensure all tests pass
4. Submit a pull request

## Code Style

- **TypeScript**: Strict mode, no `any`, functional components
- **Rust**: Standard conventions, thiserror for errors, zeroize for sensitive data
- **Commits**: Conventional commits format
