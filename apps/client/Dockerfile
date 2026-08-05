FROM node:20-alpine

WORKDIR /app

# Instalar dependencias para módulos nativos (como better-sqlite3 del monorepo)
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/client ./apps/client

RUN npm install

WORKDIR /app/apps/client

EXPOSE 5173

ENV VITE_PROXY_TARGET=http://server:3001
ENV DOCKER_ENV=true

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
