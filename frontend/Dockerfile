# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Accept a dummy publishable key at build time so Clerk does not throw during next build.
# The real key is injected at container runtime via environment variables.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_build_placeholder_00000000000
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}

COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .

# Remove TS config so only the JS version is used by PostCSS
RUN rm -f tailwind.config.ts

# Ensure public directory always exists before build
RUN mkdir -p public

RUN npm run build

# Production stage — uses Next.js standalone output for minimal image size
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the standalone server bundle produced by `output: 'standalone'`
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy public folder only if it has files (mkdir ensures the target always exists)
RUN mkdir -p ./public
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
