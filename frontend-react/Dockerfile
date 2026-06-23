# --- Frontend image: build with Node, serve static files with nginx ---

# Stage 1: build the Vite app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# The API URL is baked in at build time (Vite inlines VITE_ vars). For local
# Docker we point at the Node service via the host; override as needed.
ARG VITE_API_URL=http://localhost:8001/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: serve the built /dist with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# SPA routing: send unknown paths to index.html so React Router handles them.
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
