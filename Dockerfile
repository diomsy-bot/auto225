# Image de production AUTO225.COM
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app ./
RUN mkdir -p /data/storage && chown -R node:node /data
USER node
ENV STORAGE_DIR=/data/storage
EXPOSE 3000
# Applique les migrations puis démarre le serveur.
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -p 3000"]
