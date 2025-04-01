# ===== Stage 1: Build Stage =====
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip

# Install dependencies into wheels
COPY requirements.prod.txt .
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.prod.txt

# ===== Stage 2: Final Slim Image =====
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_DEBUG=false

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages from wheels
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/*

# Copy project files
COPY . /app

# Create the user before assigning ownership
RUN useradd -m appuser \
    && chown -R appuser:appuser /app

# Copy and make the startup script executable
COPY server.sh /app/server.sh
RUN chmod +x /app/server.sh

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

CMD ["/app/server.sh"]
