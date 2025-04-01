#!/bin/bash
set -e

# Start server
echo "Starting server..."
exec python3 manage.py runserver 0.0.0.0:8000
