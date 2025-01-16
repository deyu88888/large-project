# Parent
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . /app

# Expose port 8000
EXPOSE 8000

# For production -> Gunicorn for async workers
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "backend.wsgi:application"]