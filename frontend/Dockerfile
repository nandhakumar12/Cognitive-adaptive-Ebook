FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# For dev/test environment (Phase 1)
CMD ["npm", "run", "dev", "--", "--host"]
