# Stage 1 - Install ALL dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2 - Generate Prisma client
FROM node:22-alpine AS prisma
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# Stage 3 - Build Next.js application
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma /app/prisma ./prisma
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"
RUN npm run build

# Stage 4 - Production runtime
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps    /app/node_modules    ./node_modules
COPY --from=builder /app/.next           ./.next
COPY --from=builder /app/package.json    ./package.json
COPY --from=builder /app/next.config.ts  ./next.config.ts
COPY --from=prisma  /app/prisma          ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000
CMD ["npm", "start"]