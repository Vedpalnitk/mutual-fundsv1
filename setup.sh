#!/usr/bin/env bash
# ============================================================
# Sparrow Invest — Local Development Setup
# Run from the project root:  ./setup.sh
# ============================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[info]${NC}  $*"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $*"; }
fail()  { echo -e "${RED}[fail]${NC}  $*"; exit 1; }

echo ""
echo -e "${BOLD}=== Sparrow Invest — Local Dev Setup ===${NC}"
echo ""

# ----------------------------------------------------------
# 1. Pre-flight checks
# ----------------------------------------------------------
info "Checking prerequisites..."

# Node.js 18+
if ! command -v node &>/dev/null; then
  fail "Node.js is not installed. Install Node.js 18+ and retry."
fi
NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
  fail "Node.js 18+ required (found $(node -v))."
fi
ok "Node.js $(node -v)"

# npm
if ! command -v npm &>/dev/null; then
  fail "npm is not installed."
fi
ok "npm $(npm -v)"

# Docker
if ! command -v docker &>/dev/null; then
  fail "Docker is not installed. Install Docker Desktop and retry."
fi
ok "Docker $(docker --version | awk '{print $3}' | tr -d ',')"

# Docker daemon running
if ! docker info &>/dev/null 2>&1; then
  fail "Docker daemon is not running. Start Docker Desktop and retry."
fi
ok "Docker daemon is running"

# ----------------------------------------------------------
# 2. Port conflict check
# ----------------------------------------------------------
info "Checking for port conflicts..."
PORTS=(3800 3801 3832 3879 3890 3891)
CONFLICT=0
for PORT in "${PORTS[@]}"; do
  if lsof -iTCP:"$PORT" -sTCP:LISTEN -t &>/dev/null; then
    warn "Port $PORT is already in use."
    CONFLICT=1
  fi
done
if [ "$CONFLICT" -eq 1 ]; then
  warn "Some ports are in use. Services using those ports may fail to start."
  warn "Run 'lsof -iTCP:<port> -sTCP:LISTEN' to find the process."
else
  ok "All ports available (3800, 3801, 3832, 3879, 3890, 3891)"
fi

# ----------------------------------------------------------
# 3. Environment files
# ----------------------------------------------------------
info "Setting up environment files..."

if [ -f backend/.env ]; then
  warn "backend/.env already exists — skipping (won't overwrite)."
else
  cp backend/.env.example backend/.env
  ok "Created backend/.env from .env.example"
fi

if [ -f platforms/web/.env.local ]; then
  warn "platforms/web/.env.local already exists — skipping (won't overwrite)."
else
  cp platforms/web/.env.example platforms/web/.env.local
  ok "Created platforms/web/.env.local from .env.example"
fi

# ----------------------------------------------------------
# 4. Docker services
# ----------------------------------------------------------
info "Starting Docker services (PostgreSQL, Redis, MinIO)..."
docker compose -f docker-compose.dev.yml up -d

info "Waiting for PostgreSQL to be healthy..."
RETRIES=30
until docker exec si-dev-postgres pg_isready -U siuser -d sparrowinvest_local &>/dev/null || [ "$RETRIES" -eq 0 ]; do
  sleep 1
  RETRIES=$((RETRIES - 1))
done
if [ "$RETRIES" -eq 0 ]; then
  fail "PostgreSQL did not become healthy in time."
fi
ok "PostgreSQL is ready on port 3832"

info "Waiting for Redis to be healthy..."
RETRIES=15
until docker exec si-dev-redis redis-cli ping 2>/dev/null | grep -q PONG || [ "$RETRIES" -eq 0 ]; do
  sleep 1
  RETRIES=$((RETRIES - 1))
done
if [ "$RETRIES" -eq 0 ]; then
  fail "Redis did not become healthy in time."
fi
ok "Redis is ready on port 3879"

ok "MinIO API on port 3890, Console on port 3891"

# ----------------------------------------------------------
# 5. Backend dependencies
# ----------------------------------------------------------
info "Installing backend dependencies..."
(cd backend && npm install)
ok "Backend dependencies installed"

# ----------------------------------------------------------
# 6. Database setup
# ----------------------------------------------------------
info "Generating Prisma client..."
(cd backend && npx prisma generate)
ok "Prisma client generated"

info "Pushing schema to database..."
(cd backend && npx prisma db push)
ok "Database schema applied"

info "Running seed scripts..."
(cd backend && npm run db:seed:all)
ok "Database seeded"

# ----------------------------------------------------------
# 7. Frontend dependencies
# ----------------------------------------------------------
info "Installing frontend dependencies..."
(cd platforms/web && npm install)
ok "Frontend dependencies installed"

# ----------------------------------------------------------
# 8. Summary
# ----------------------------------------------------------
echo ""
echo -e "${BOLD}=== Setup Complete ===${NC}"
echo ""
echo -e "  ${CYAN}Frontend${NC}       http://localhost:3800          cd platforms/web && npm run dev"
echo -e "  ${CYAN}Backend${NC}        http://localhost:3801          cd backend && npm run start:dev"
echo -e "  ${CYAN}Swagger${NC}        http://localhost:3801/api/docs"
echo -e "  ${CYAN}MinIO Console${NC}  http://localhost:3891          minioadmin / minioadmin"
echo -e "  ${CYAN}Prisma Studio${NC}  http://localhost:5555          cd backend && npm run db:studio"
echo ""
echo -e "  ${BOLD}Demo Accounts${NC}"
echo -e "  ─────────────────────────────────────────────────────"
echo -e "  amit.verma@demo.com         Demo@123   (Self-service user)"
echo -e "  priya.patel@demo.com        Demo@123   (Managed user)"
echo -e "  rajesh.sharma@demo.com      Demo@123   (Managed user)"
echo -e "  admin@sparrow-invest.com    Admin@123  (Admin)"
echo -e "  advisor@sparrow-invest.com  Advisor@123 (Financial Advisor)"
echo ""
echo -e "  ${BOLD}Useful Commands${NC}"
echo -e "  ─────────────────────────────────────────────────────"
echo -e "  docker compose -f docker-compose.dev.yml logs -f     Follow Docker logs"
echo -e "  docker compose -f docker-compose.dev.yml down         Stop services"
echo -e "  docker compose -f docker-compose.dev.yml down -v      Stop + wipe data"
echo ""
