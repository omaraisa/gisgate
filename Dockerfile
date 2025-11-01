# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine AS base

# Dependencies stage - install only production dependencies
FROM base AS deps
# Install Python, build tools, and canvas dependencies (pixman, cairo, etc.)
RUN apk add --no-cache libc6-compat python3 py3-pip build-base pkgconfig pixman-dev cairo-dev jpeg-dev giflib-dev librsvg-dev pango-dev
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Builder stage - build the application
FROM base AS builder
# Install Python for canvas compilation
RUN apk add --no-cache python3
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