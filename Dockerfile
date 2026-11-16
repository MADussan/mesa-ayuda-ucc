# Imagen liviana con Node.js 22
FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/app/data

WORKDIR /app

# Primero solo las dependencias, para aprovechar la caché de capas
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Código de la aplicación
COPY server.js ./
COPY src ./src
COPY public ./public

# Carpeta de datos: aquí vive solicitudes.json y se monta como volumen
RUN mkdir -p /app/data && chown -R node:node /app/data
VOLUME ["/app/data"]

# No ejecutar como root
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:${PORT}/salud || exit 1

CMD ["node", "server.js"]
