# Stage 1: Build Vue frontend
FROM node:22-alpine AS builder
WORKDIR /app

# Copy frontend package files and install
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# Copy frontend source and content
COPY frontend/ ./

# Copy synced content if exists (mounted at build time)
# Content should be pre-synced or mounted via docker build --build-arg

# Build
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy custom nginx config for SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
