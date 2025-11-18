# Multi-stage build for React + Node.js app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source files
COPY . .

# Build React app (set GENERATE_SOURCEMAP=false to reduce build size)
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built app from builder
COPY --from=builder /app/build ./build

# Copy server files and necessary config files
COPY server.js ./
COPY start-railway.js ./
COPY craco.config.js ./
COPY postcss.config.js ./
COPY tailwind.config.js ./

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]

