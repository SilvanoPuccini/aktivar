# =============================================================================
# Aktivar Backend Dockerfile
# Python 3.12 + Django + Daphne (ASGI) + Gunicorn
# =============================================================================

FROM python:3.12-slim AS base

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies required for:
# - gcc: compiling Python C extensions
# - libpq-dev: PostgreSQL client library (psycopg2)
# - gdal-bin, libgdal-dev: GDAL for PostGIS/GeoDjango support
# - netcat-openbsd: for health check scripts
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    gdal-bin \
    libgdal-dev \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies first (layer caching optimization)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY . .

# Collect static files (will use whitenoise in production)
# This requires a minimal settings configuration; skipped if SECRET_KEY is not set
RUN SECRET_KEY=build-placeholder \
    DATABASE_URL=sqlite:///tmp/build.db \
    python manage.py collectstatic --noinput 2>/dev/null || true

# Create a non-root user for security
RUN addgroup --system django && \
    adduser --system --ingroup django django && \
    chown -R django:django /app
USER django

# Expose the application port
EXPOSE 8000

# Run with daphne (ASGI server) for WebSocket support
# Gunicorn handles HTTP workers, daphne handles WS connections
# In production, use daphne as the primary server since it handles both HTTP and WS
CMD ["daphne", \
    "-b", "0.0.0.0", \
    "-p", "8000", \
    "--access-log", "-", \
    "aktivar.asgi:application"]
