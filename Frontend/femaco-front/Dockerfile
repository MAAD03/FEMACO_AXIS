# ---------- Etapa 1: compilar Angular ----------
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx ng build --configuration production

# ---------- Etapa 2: Nginx ----------
FROM nginx:1.29-alpine

ENV API_BASE_URL=/api \
    BACKEND_UPSTREAM=127.0.0.1:8080

COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/config.template.json /etc/nginx/runtime/config.template.json
COPY docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

COPY --from=build /app/dist/femaco-front/browser /usr/share/nginx/html

EXPOSE 80