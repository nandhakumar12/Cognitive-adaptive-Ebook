FROM node:22-alpine

RUN apk update && \
    apk upgrade --no-cache && \
    npm install -g npm@latest --ignore-scripts && \
    rm -rf /var/cache/apk/*

WORKDIR /app
RUN chown node:node /app

USER node
COPY --chown=node:node package*.json ./
RUN npm install --ignore-scripts && \
    npm cache clean --force

COPY --chown=node:node . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host"]
