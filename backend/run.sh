#!/bin/bash
set -e

# Start the Daphne server
echo "Starting Daphne server..."
exec daphne -b 0.0.0.0 -p 8000 backend.asgi:application
