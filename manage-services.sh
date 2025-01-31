#!/bin/bash

# Update Nginx configuration
NGINX_SOURCE="/home/ubuntu/code/formula-binance-atm/nginx"
NGINX_TARGET="/etc/nginx/sites-available/nextjs-app"

sudo systemctl daemon-reload

echo "Updating Nginx configuration..."
sudo cp "$NGINX_SOURCE" "$NGINX_TARGET"
sudo systemctl reload nginx.service
echo "Nginx configuration updated and reloaded successfully!"

# Restart FastAPI service
echo "Restarting FastAPI service..."
sudo systemctl restart fastapi.service
echo "FastAPI service restarted successfully!"

# Restart Next.js service
echo "Restarting Next.js service..."
sudo systemctl restart nextjs.service
echo "Next.js service restarted successfully!"

echo "All services updated and restarted successfully!"
