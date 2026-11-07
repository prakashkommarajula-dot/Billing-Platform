FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build tools for native compilation if required by dependencies
RUN apk add --no-cache python3 make g++

# Copy package manifests first for optimal Docker layer caching
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy all backend source code
COPY . .

# Set environment defaults
ENV NODE_ENV=production \
    PORT=5000 \
    MONGODB_URI=mongodb://mongodb:27017/invoice_billing_platform \
    MONGO_URI=mongodb://mongodb:27017/invoice_billing_platform \
    JWT_SECRET=super_secret_jwt_key_invoice_billing_prod_2026_xyz123

# Expose backend REST API port
EXPOSE 5000

# Start Express server
CMD ["node", "server.js"]
