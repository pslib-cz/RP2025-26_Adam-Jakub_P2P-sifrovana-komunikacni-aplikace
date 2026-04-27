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
RUN npm install
COPY server/ .

FROM node:22-alpine
WORKDIR /app

COPY --from=build-backend /app/server ./server
COPY --from=build-frontend /app/dist ./dist

WORKDIR /app/server
RUN mkdir -p /data

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
