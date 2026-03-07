FROM node:22-alpine

# ── Patch all OS-level packages (fixes CVE-2026-22184 zlib CRITICAL) ─────────
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

# Upgrade npm to fix bundled-dependency CVEs (tar, glob, minimatch, cross-spawn)
RUN npm install -g npm@latest

WORKDIR /app

COPY package*.json ./
# --omit=dev is the modern equivalent of --only=production
RUN npm ci --omit=dev

# Remove npm after install to reduce attack surface
RUN npm uninstall -g npm || true

COPY . .

EXPOSE 3005

# Run as non-root user
USER node

CMD ["node", "src/index.js"]
