# --- Build stage ---
FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx vite build

# --- Production stage ---
FROM node:22-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && apk del python3 make g++

COPY server/ ./server/
COPY --from=build /app/dist ./dist/

EXPOSE 3001

CMD ["node", "--import", "tsx/esm", "server/main.ts"]
