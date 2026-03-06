FROM node:22-alpine

# Upgrade npm to fix bundled-dependency CVEs (tar, glob, minimatch, cross-spawn)
RUN npm install -g npm@latest

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Remove npm after install to reduce attack surface
RUN npm uninstall -g npm || true

COPY . .

EXPOSE 3005

# Run as non-root user
USER node

CMD ["node", "src/index.js"]
