FROM node:20-alpine
WORKDIR /app
COPY server.js ./
COPY public/ ./public/
RUN mkdir -p /app/data
VOLUME ["/app/data"]
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
