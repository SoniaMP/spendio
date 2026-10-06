# --- Build stage ---
FROM node:22.19.0-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx vite build

# --- Production stage ---
FROM node:22.19.0-alpine

# No C++ toolchain: better-sqlite3 ships musl prebuilds (node-v127-linuxmusl-*),
# which is the ABI Node 22 uses, so `prebuild-install` downloads a binary instead
# of compiling. Installing and deleting python3/make/g++ was ~200 MB of download
# on every cold build for nothing.
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server/ ./server/
COPY shared/ ./shared/
COPY --from=build /app/dist ./dist/

EXPOSE 3001

CMD ["node", "--import", "tsx/esm", "server/main.ts"]
