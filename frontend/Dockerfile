# Angular Frontend
FROM node:20-slim AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Build SSR server output
RUN npm run build

# Serve with Node SSR output (Angular outputMode=server produces server.mjs)
EXPOSE 4200
CMD ["node", "dist/abb_hack/server/server.mjs"]
