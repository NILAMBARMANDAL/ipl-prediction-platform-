# --- Node backend image ---
FROM node:20-alpine

WORKDIR /app

# Copy manifests first so Docker can cache the dependency layer (only reinstalls
# when package.json changes, not on every code edit).
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the source.
COPY . .

EXPOSE 8001

CMD ["node", "src/index.js"]
