# Universal Crypto Wallet

A production-grade, non-custodial Hierarchical Deterministic (HD) cryptocurrency wallet built with Rust (Axum) backend and React (Vite + TypeScript) frontend.

![Universal Wallet](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Rust](https://img.shields.io/badge/rust-1.75+-orange.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3+-blue.svg)

## 🎯 Features

- **Multi-Chain Support**: Manage Ethereum, Bitcoin, and Solana from a single interface
- **HD Wallet (BIP39/BIP44)**: Generate unlimited wallets from one seed phrase
- **Secure by Design**: AES-256-GCM encryption, Argon2id password hashing, zeroize for memory safety
- **Modern UI**: Notion-inspired design with blue gradient aesthetics and Framer Motion animations
- **Admin Panel**: Comprehensive user management and system monitoring
- **JWT Authentication**: Secure token-based auth with refresh token rotation

## 🏗️ Architecture

### Tech Stack

**Backend (Rust)**
- Framework: Axum 0.7
- Database: PostgreSQL with SQLx
- Authentication: JWT + Argon2id
- Wallet Core: BIP39, BIP32/44
- Encryption: AES-256-GCM
- Caching: Redis

**Frontend (TypeScript)**
- Framework: React 19 + Vite
- Routing: TanStack Router
- State: Zustand + TanStack Query
- Styling: Tailwind CSS v4 + shadcn/ui
- Animations: Framer Motion
- Validation: Zod

### Monorepo Structure

```
universal-wallet/
├── apps/
│   ├── web/                 # Frontend (Vite + React + TypeScript)
│   └── backend/             # Rust Backend (Axum)
├── packages/
│   └── shared/              # Shared TypeScript types & Zod schemas
├── docker-compose.yml       # Docker orchestration
└── package.json             # Root package.json
```

## 🚀 Getting Started

### Prerequisites

- **Rust**: 1.75 or higher
- **Node.js**: 18 or higher
- **pnpm**: 8 or higher
- **PostgreSQL**: 15 or higher
- **Redis**: 7 or higher

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd universal-wallet
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**

Backend:
```bash
cd apps/backend
cp .env.example .env
# Edit .env with your configuration
```

Frontend:
```bash
cd apps/web
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up the database**
```bash
cd apps/backend
# SQLx will run migrations automatically on startup
```

5. **Start development servers**

From the root directory:
```bash
# Start both frontend and backend
pnpm dev

# Or start individually
pnpm --filter @universal/web dev        # Frontend: http://localhost:3000
cargo run --manifest-path apps/backend/Cargo.toml  # Backend: http://localhost:8080
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ this will delete all data)
docker-compose down -v
```

### Services

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/universal_wallet` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `PORT` | Backend server port | `8080` |
| `JWT_SECRET` | Secret key for JWT signing | (change in production!) |
| `JWT_EXPIRATION` | Access token expiration | `15m` |
| `REFRESH_TOKEN_EXPIRATION` | Refresh token expiration | `7d` |

## 🔐 Security Features

### Encryption at Rest
- Private keys encrypted with AES-256-GCM
- Encryption key derived from user password via Argon2id
- Sensitive data zeroed from memory after use

### Authentication
- Argon2id password hashing (OWASP recommended)
- JWT with short-lived access tokens
- Refresh token rotation
- Secure token storage

### API Security
- Input validation with Zod (shared schemas)
- SQL injection prevention via SQLx parameterized queries
- CORS configuration
- Request rate limiting (via Redis)

### Memory Safety
- Rust's ownership model prevents data races
- `zeroize` crate for secure memory clearing
- No raw pointers in crypto code

## 📡 API Documentation

### Authentication

```
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

POST /api/auth/refresh
{
  "refresh_token": "..."
}
```

### Wallets

```
GET /api/wallets
Authorization: Bearer <token>

POST /api/wallets/create
{
  "name": "My ETH Wallet",
  "mnemonic": "optional existing mnemonic"
}

POST /api/wallets/import
{
  "name": "Imported Wallet",
  "mnemonic": "your 24-word mnemonic"
}

GET /api/wallets/:id/balance
```

### Transactions

```
POST /api/transactions/send
{
  "wallet_id": "uuid",
  "recipient_address": "0x...",
  "amount": "0.1",
  "password": "your-password"
}
```

### Admin (Requires Admin Role)

```
GET /api/admin/users?page=1&limit=20
GET /api/admin/stats
```

## 🧪 Testing

### Backend Tests

```bash
cd apps/backend
cargo test

# Run specific test
cargo test wallet::hd_wallet::tests
```

### Frontend Tests

```bash
cd apps/web
pnpm test
```

## 📁 Project Structure

### Backend (Rust)

```
apps/backend/
├── src/
│   ├── main.rs              # Entry point
│   ├── router.rs            # API routing
│   ├── state.rs             # Application state
│   ├── auth/                # Authentication handlers
│   ├── wallet/              # Wallet core logic
│   │   ├── handlers.rs      # Wallet endpoints
│   │   ├── hd_wallet.rs     # BIP39/BIP44 derivation
│   │   └── encryption.rs    # AES-256-GCM encryption
│   ├── transactions/        # Transaction handling
│   ├── admin/               # Admin endpoints
│   ├── db/                  # Database models & queries
│   ├── middleware/          # Auth middleware
│   └── error/               # Error handling
├── migrations/              # SQL migrations
└── Cargo.toml
```

### Frontend (TypeScript)

```
apps/web/
├── src/
│   ├── main.tsx             # Entry point
│   ├── routes/              # TanStack Router routes
│   ├── pages/               # Page components
│   ├── components/          # Reusable components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Layout components
│   │   └── auth/            # Auth components
│   ├── stores/              # Zustand stores
│   ├── hooks/               # Custom hooks
│   └── lib/                 # Utilities
└── package.json
```

## 🎨 Design System

### Color Palette

- **Primary Blue**: `#1e3a8a` (Deep Blue)
- **Accent Cyan**: `#06b6d4` (Vibrant Cyan)
- **Secondary Indigo**: `#6366f1` (Soft Indigo)

### Typography

- Clean, minimal fonts inspired by Notion
- Generous whitespace for readability
- Smooth animations with Framer Motion

## 🚧 Roadmap

- [ ] Multi-chain balance aggregation
- [ ] Transaction history with charts
- [ ] NFT gallery
- [ ] Hardware wallet integration
- [ ] Mobile app (React Native)
- [ ] DApp browser
- [ ] Staking support
- [ ] Multi-signature wallets

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## 📄 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This is a demonstration project for educational purposes. Always audit security-critical code before using it with real funds. The authors are not responsible for any loss of funds.

## 🙏 Acknowledgments

- [Axum](https://github.com/tokio-rs/axum) - Excellent web framework
- [SQLx](https://github.com/launchbadge/sqlx) - Compile-time checked SQL
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Framer Motion](https://www.framer.com/motion/) - Smooth animations

---

Built with ❤️ using Rust & TypeScript
