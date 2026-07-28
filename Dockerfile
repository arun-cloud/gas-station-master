# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Prisma requires OpenSSL and standard Linux runtime libraries.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files first so Docker can cache npm installation.
COPY package.json package-lock.json ./

RUN npm ci

# Copy application source.
COPY . .

EXPOSE 3000
EXPOSE 5555

# Generate Prisma Client after environment variables are supplied
# by Docker Compose, then start Next.js.
CMD ["sh", "-c", "npm run db:generate && npm run dev:docker"]