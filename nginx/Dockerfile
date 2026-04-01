# =============================================================================
# Aktivar Nginx + Frontend — Multi-stage build
# Stage 1: Build React/Vite app
# Stage 2: Nginx serves the built SPA + proxies API to backend
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Build the React/Vite application
# ---------------------------------------------------------------------------
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Build args for Vite (must be available at build time)
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_STRIPE_PUBLIC_KEY=
ARG VITE_SENTRY_DSN=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: Nginx serves SPA + reverse-proxies API
# ---------------------------------------------------------------------------
FROM nginx:alpine

# Remove default content
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy built frontend
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Copy reverse-proxy config (replaces the entire nginx.conf)
COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
