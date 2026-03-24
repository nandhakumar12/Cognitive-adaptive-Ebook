FROM node:22-alpine

RUN apk update && \
    apk upgrade --no-cache && \
    npm install -g npm@latest --ignore-scripts && \
    rm -rf /var/cache/apk/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force && \
    rm -rf ~/.npm && \
    npm uninstall -g npm || true

COPY . .

EXPOSE 3003

USER node

CMD ["node", "src/index.js"]
