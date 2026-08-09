#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env.example ]; then
  cat <<'ENVEOF' > .env.example
POSTGRES_USER=kjar
POSTGRES_PASSWORD=kjar_password
POSTGRES_DB=kjar
DATABASE_URL=postgres://kjar:kjar_password@db:5432/kjar
DB_PORT=5433

PORT=3001
BCRYPT_SALT_ROUNDS=12
JWT_SECRET=change_me
CORS_ORIGIN=http://localhost:3000

NEXT_PUBLIC_API_BASE=http://localhost:3001/api/v1
ENVEOF
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Update values if needed."
fi

docker compose --env-file "$ROOT_DIR/.env" -f docker/docker-compose.dev.yml up --build
