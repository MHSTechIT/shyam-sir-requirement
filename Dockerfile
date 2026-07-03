# Single-image build: compiles the React frontend and the Express backend,
# then serves both from the Node backend. Provide DATABASE_URL at runtime.
FROM node:22-slim AS build
WORKDIR /app

# Install deps (root + both workspaces) using lockfiles where present.
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm install && npm --prefix backend install && npm --prefix frontend install

# Build.
COPY . .
RUN npm --prefix frontend run build \
 && npm --prefix backend run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV UPLOAD_DIR=/app/backend/uploads

# Copy backend runtime + SQL schema + built frontend assets.
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/db ./backend/db
COPY --from=build /app/frontend/dist ./frontend/dist

EXPOSE 4000
WORKDIR /app/backend
# The app creates tables on boot (ensureSchema), then starts serving.
CMD ["node", "dist/index.js"]
