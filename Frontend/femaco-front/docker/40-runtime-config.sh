#!/bin/sh
set -e
envsubst '${API_BASE_URL}' < /etc/nginx/runtime/config.template.json \
  > /usr/share/nginx/html/config.json
echo "config.json generado con API_BASE_URL=${API_BASE_URL}"