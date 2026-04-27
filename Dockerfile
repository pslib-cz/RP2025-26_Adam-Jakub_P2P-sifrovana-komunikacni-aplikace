FROM node:22-alpine AS build-frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS build-backend
RUN apk add --no-cache python3 make g++
WORKDIR /app/server
COPY server/package*.json ./
COPY server/tsconfig.json ./
RUN npm install
COPY server/ .
RUN npm run build

FROM node:22-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Copy built backend and frontend
COPY --from=build-backend /app/server/dist ./server/dist
COPY --from=build-backend /app/server/package*.json ./server/
COPY --from=build-frontend /app/dist ./dist

WORKDIR /app/server
# Install only production dependencies
RUN npm install --omit=dev

# Ensure /data exists for SQLite
RUN mkdir -p /data

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
