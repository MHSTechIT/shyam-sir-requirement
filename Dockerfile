# Single-image build: compiles the React client and the Express/Prisma server,
# then serves both from the Node server. Provide DATABASE_URL at runtime.
FROM node:22-slim AS build
WORKDIR /app

# Prisma needs OpenSSL.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install deps (root + both workspaces) using lockfiles where present.
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm install && npm --prefix server install && npm --prefix client install

# Build.
COPY . .
RUN npm --prefix client run build \
 && npm --prefix server run build

FROM node:22-slim AS runtime
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV UPLOAD_DIR=/app/server/uploads

# Copy server runtime + generated Prisma client + built client assets.
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/node_modules ./server/node_modules
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/prisma ./server/prisma
COPY --from=build /app/client/dist ./client/dist

EXPOSE 4000
WORKDIR /app/server
# Apply migrations, then start.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
