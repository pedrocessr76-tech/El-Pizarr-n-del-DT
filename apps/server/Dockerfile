FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias para módulos nativos (como mejor sqlite3 / sqlite3)
RUN apk add --no-cache python3 make g++

# Copiar archivos raíz y workspace packages
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/server ./apps/server

# Instalar dependencias y construir servidor
RUN npm install
RUN npm run build --workspace=server

# Imagen final de ejecución
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/server ./apps/server
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/apps/server

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

CMD ["npm", "run", "start"]
