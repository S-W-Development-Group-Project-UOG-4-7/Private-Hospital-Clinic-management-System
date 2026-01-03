#!/usr/bin/env bash
set -euo pipefail

# Basic project sync script for local dev machines
# Usage: ./scripts/sync-project.sh

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Fetching origin and resetting local branch '${BRANCH}' to remote..."

git fetch origin
if git show-ref --verify --quiet refs/remotes/origin/${BRANCH}; then
  echo "Resetting to origin/${BRANCH}"
  git reset --hard origin/${BRANCH}
else
  echo "Remote branch origin/${BRANCH} not found; pulling origin/main instead"
  git reset --hard origin/main
fi

echo "Cleaning untracked files"
git clean -fd

# Backend setup (Laravel)
if [ -f backend/composer.json ]; then
  echo "Installing backend PHP dependencies..."
  (cd backend && composer install --no-interaction --prefer-dist)
  echo "Running migrations (use --force in CI) and seeding clinics"
  (cd backend && php artisan migrate --force || true)
  (cd backend && php artisan db:seed --class=ClinicSeeder || true)
  (cd backend && php artisan optimize:clear || true)
fi

# Frontend setup
if [ -f frontend/package.json ]; then
  echo "Installing frontend dependencies and building..."
  (cd frontend && npm ci)
  (cd frontend && npm run build)
fi

echo "Sync complete. You may need to restart local servers or clear caches."