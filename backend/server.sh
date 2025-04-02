#!/bin/bash
set -e

# Remove existing db and api/migrations/0001_initial.py
echo "Cleaning up old DB and initial migration..."
rm -f db.sqlite3
rm -f api/migrations/0001_initial.py
rm -f api/migrations/__pycache__/*

# Run Django migrations and other setup commands
echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate

# Optional: Load seed data
echo "Seeding data..."
python manage.py seed

# Start server
echo "Starting server..."
exec python3 manage.py runserver 0.0.0.0:8000
