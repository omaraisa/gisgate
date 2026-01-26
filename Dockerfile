# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine AS base

# Dependencies stage - install only production dependencies
FROM base AS deps
# Install build tools only (no canvas-specific deps needed for @napi-rs/canvas)
RUN apk add --no-cache libc6-compat python3 build-base
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Builder stage - build the application
FROM base AS builder
# Install build tools only
RUN apk add --no-cache libc6-compat python3 build-base
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

# SECURITY: Install only essential runtime dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# SECURITY: Create non-root user with minimal privileges
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/.next /app/public && \
    chown -R nextjs:nodejs /app

# Copy ONLY the built application (standalone includes everything needed)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# SECURITY: Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# SECURITY: Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# The standalone build includes a server.js file
CMD ["node", "server.js"]