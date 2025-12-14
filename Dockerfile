# Use Node.js 20 slim for better compatibility with native modules
FROM node:20-slim AS base

# Dependencies stage - install only production dependencies
FROM base AS deps
# Install Python, build tools, and canvas dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    pkg-config \
    libpixman-1-dev \
    libcairo2-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpango1.0-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Builder stage - build the application
FROM base AS builder
# Install Python for canvas compilation
RUN apt-get update && apt-get install -y python3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy installed dependencies from deps stage (not from host!)
COPY --from=deps /app/node_modules ./node_modules

# Copy source code from host project directory
COPY . .

# Generate Prisma client for build
RUN npx prisma generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SERVER_IP=204.12.205.110
RUN npm run build

# Production runtime - minimal final image
FROM base AS runner
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy ONLY the built application (standalone includes everything needed)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set ownership for non-root user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# The standalone build includes a server.js file
CMD ["node", "server.js"]