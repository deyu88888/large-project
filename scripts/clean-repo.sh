#!/bin/bash
set -e

# Go to repo root (assumes script is in scripts/)
cd "$(dirname "$0")/.."

echo "Cleaning frontend..."
rm -rf frontend/node_modules frontend/dist frontend/coverage

echo "Cleaning backend..."
rm -rf backend/.pytest_cache backend/venv backend/htmlcov backend/db.sqlite3

echo "Cleanup complete. Ready for zip & submit!"
