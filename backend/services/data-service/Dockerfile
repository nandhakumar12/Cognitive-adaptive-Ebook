FROM node:22-alpine

RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

RUN npm install -g npm@latest

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
