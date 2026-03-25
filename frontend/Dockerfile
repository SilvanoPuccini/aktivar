# =============================================================================
# Aktivar Frontend Dockerfile
# Multi-stage build: Node 20 (build) -> Nginx (serve)
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Build the React/Vite application
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Declare build args so Vite can use them at build time
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_STRIPE_PUBLIC_KEY=
ARG VITE_SENTRY_DSN=

# Make them available as env vars during build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

# Copy dependency manifests first for layer caching
COPY package.json package-lock.json ./

# Install dependencies with clean install (deterministic builds)
RUN npm ci

# Copy source code and build artifacts config
COPY . .

# Build the production bundle
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: Serve with Nginx
# ---------------------------------------------------------------------------
FROM nginx:alpine AS production

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy the built application from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Nginx runs in the foreground
CMD ["nginx", "-g", "daemon off;"]
