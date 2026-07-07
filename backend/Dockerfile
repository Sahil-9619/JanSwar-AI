FROM node:20-alpine
WORKDIR /app

# Install curl for Docker health check and OpenSSL for Prisma engines
RUN apk add --no-cache curl openssl

# Install dependencies
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy source and generate Prisma client
COPY . .
RUN npx prisma generate --schema=src/prisma/schema.prisma

# Build TypeScript
RUN npm run build

EXPOSE 5000

# Push schema to DB then start server
# Seed is skipped in production (ts-node is a devDependency)
CMD ["sh", "-c", "npx prisma db push --schema=src/prisma/schema.prisma --accept-data-loss && node dist/index.js"]
