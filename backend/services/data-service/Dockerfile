FROM node:22-alpine

RUN apk update && \
    apk upgrade --no-cache && \
    npm install -g npm@latest && \
    rm -rf /var/cache/apk/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && \
    npm cache clean --force && \
    rm -rf ~/.npm

RUN npm uninstall -g npm || true

COPY . .

EXPOSE 3005

USER node

CMD ["node", "src/index.js"]
