#!/bin/bash

# Paths
NGINX_SOURCE="/home/ubuntu/code/formula-binance-atm/nginx"
NGINX_TARGET="/etc/nginx/sites-available/nextjs-app"

# Copy the Nginx configuration file
sudo cp "$NGINX_SOURCE" "$NGINX_TARGET"

# Reload Nginx to apply changes
sudo systemctl reload nginx.service

echo "Nginx configuration updated and reloaded successfully!"
