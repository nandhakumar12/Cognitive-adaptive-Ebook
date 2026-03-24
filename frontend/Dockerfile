FROM node:22-alpine

RUN apk update && \
    apk upgrade --no-cache && \
    npm install -g npm@latest --ignore-scripts && \
    rm -rf /var/cache/apk/*

WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts && \
    npm cache clean --force

COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

EXPOSE 3000

USER node

CMD ["npm", "run", "dev", "--", "--host"]
