# 🚀 Quick Start Guide - Universal Crypto Wallet

## Prerequisites Checklist

- [ ] Rust 1.75+ installed
- [ ] Node.js 18+ installed
- [ ] pnpm 8+ installed
- [ ] Docker & Docker Compose (optional, for containerized deployment)

## Option 1: Local Development (Recommended for Development)

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Start Infrastructure (PostgreSQL + Redis)
```bash
docker-compose up -d postgres redis
```

### Step 3: Configure Environment

**Backend** (`apps/backend/.env`):
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/universal_wallet
REDIS_URL=redis://localhost:6379
PORT=8080
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d
```

**Frontend** (`apps/web/.env`):
```bash
VITE_API_URL=http://localhost:8080/api
```

### Step 4: Start Backend
```bash
cd apps/backend
cargo run
```

Backend will start on http://localhost:8080 and automatically run database migrations.

### Step 5: Start Frontend (new terminal)
```bash
cd apps/web
pnpm dev
```

Frontend will start on http://localhost:3000 with hot reloading.

### Step 6: Open Browser
Navigate to http://localhost:3000

You'll see the animated landing page with:
- Blue gradient background
- "One Wallet. All Chains." hero
- Feature cards
- "Launch App" and "Create Wallet" buttons

Click any button to open the auth modal and create an account!

---

## Option 2: Docker Deployment (Recommended for Production)

### One-Command Deploy
```bash
docker-compose up -d --build
```

This builds and starts:
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ Rust backend (port 8080)
- ✅ React frontend (port 80)

### Access Your Application
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

### View Logs
```bash
docker-compose logs -f
```

### Stop Everything
```bash
docker-compose down
```

---

## 🧪 Testing the Application

### 1. Create an Account
1. Click "Launch App" on the landing page
2. Enter email and password
3. Click "Create Account"
4. You'll be redirected to the dashboard

### 2. Explore the Dashboard
- View portfolio overview
- See wallet balances
- Check recent activity

### 3. Try the Admin Panel
- Navigate to Admin section
- View user management table
- Check system statistics

---

## 🛠️ Common Commands

### Development
```bash
# Start both frontend and backend
pnpm dev

# Start only frontend
pnpm --filter @universal/web dev

# Start only backend
cargo run --manifest-path apps/backend/Cargo.toml

# Install new dependency
pnpm add <package> --filter @universal/web

# Run backend tests
cargo test --manifest-path apps/backend/Cargo.toml
```

### Production
```bash
# Build for production
pnpm build

# Deploy with Docker
docker-compose up -d --build

# Rebuild after code changes
docker-compose up -d --build frontend  # or backend
```

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Port Already in Use
Edit the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "8081:8080"  # Change 8080 to 8081
```

### Frontend Can't Connect to Backend
1. Check backend is running: http://localhost:8080/health
2. Verify `VITE_API_URL` in `apps/web/.env`
3. Check CORS settings in backend

### Rust Build Errors
```bash
# Clean and rebuild
cd apps/backend
cargo clean
cargo build
```

### TypeScript Errors
```bash
# Reinstall dependencies
rm -rf node_modules
pnpm install

# Rebuild shared package
pnpm --filter @universal/shared build
```

---

## 📚 Next Steps

1. **Read the full documentation**: See `README.md`
2. **Understand the architecture**: See `PROJECT_SUMMARY.md`
3. **Contribute to the project**: See `CONTRIBUTING.md`
4. **View API documentation**: See endpoints in `README.md`

---

## 🆘 Need Help?

- Check `README.md` for detailed documentation
- Review `PROJECT_SUMMARY.md` for complete file structure
- See `.cursorrules` for code style guidelines

---

**Happy Coding! 🎉**
