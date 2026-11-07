# Stage 1: Build Vite React Production Bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies needed for building
RUN npm install

# Copy application source code
COPY . .

# Build production assets (outputs to /app/dist)
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

# Remove default nginx HTML files
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA routing and API reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
