# Crypto Trading Chart Application

A real-time cryptocurrency trading chart built with Next.js and Lightweight Charts.

## Quick Start

### 1. Setup Development Environment

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install and use Node.js 20
nvm install v20.18.2
nvm use v20.18.2
```

### 2. Project Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Edit `.env.local` with your configuration:
```
NEXT_PUBLIC_WS_URL=wss://your-websocket-url
NEXT_PUBLIC_API_URL=http://your-api-url
```

## Basic Chart Implementation

Create a new file `pages/chart.tsx`:

```typescript
import { createChart, IChartApi } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

export default function ChartPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    chart.current = createChart(chartContainerRef.current, {
      width: 800,
      height: 600,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
    });

    // Add candlestick series
    const candleSeries = chart.current.addCandlestickSeries();

    // Load initial data
    fetch('/api/historical-data')
      .then(res => res.json())
      .then(data => {
        candleSeries.setData(data);
      });

    // Connect to WebSocket for real-time updates
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || '');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      candleSeries.update(data);
    };

    // Cleanup
    return () => {
      ws.close();
      chart.current?.remove();
    };
  }, []);

  return <div ref={chartContainerRef} />;
}
```

## Building for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

## Common Tasks

### Adding Trading Signals

```typescript
// Inside WebSocket onmessage handler
if (data.signal) {
  candleSeries.createPriceLine({
    price: data.close,
    color: data.signal === 'BUY' ? '#4CAF50' : '#FF5252',
    lineWidth: 2,
    title: data.signal
  });
}
```

### Adding Technical Indicators

```typescript
// Add SMA indicator
const smaSeries = chart.current.addLineSeries({
  color: '#2962FF',
  lineWidth: 2,
  title: 'SMA 20'
});

// Update SMA with new data
smaSeries.setData(smaData);
```

## Troubleshooting

- **Chart not rendering?** Make sure the container has width/height.
- **No real-time updates?** Check WebSocket URL in `.env.local`.
- **Build failing?** Ensure all dependencies are installed with `npm install`.

## Need Help?

- Review [Lightweight Charts docs](https://tradingview.github.io/lightweight-charts/)
- Check [Next.js documentation](https://nextjs.org/docs)




Below is the raw text version you can add to your README.md for deployment instructions:

### Deployment on the Server (Production Setups)

After you are satisfied with your code, follow these steps to deploy your Next.js application on your server:

1. Stop the Running Application  
   (Assuming you have a systemd service for Next.js named "nextjs")  
```bash  
   sudo systemctl stop nextjs
```
2. Build the Application
  
   This will generate an optimized production build:  
```bash  
   npm run build
```      
3. Reload Systemd Configuration
   
   If you made changes to your service file:  
```bash 
   sudo systemctl daemon-reload
```
4. Start the Application

   Restart your Next.js service:
```bash    
   sudo systemctl start nextjs
```
5. Check the Service Status  
   Verify that your service is running correctly:  
```bash 
   sudo systemctl status nextjs
```
#### Nginx Configuration for Reverse Proxy

If you're using Nginx as a reverse proxy to serve your Next.js application, ensure that you have the proper server block. For example, create or update your Nginx configuration file (typically located in /etc/nginx/sites-available/nextjs) with the following content:
```bash
server {
    listen 80;
    server_name yourdomain.com;  # Replace with your actual domain

    location / {
        proxy_pass http://localhost:3000;  # Adjust if your Next.js app listens on a different port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Then enable the configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/nextjs /etc/nginx/sites-enabled/
sudo nginx -t      # Test the Nginx configuration
sudo systemctl restart nginx
```
These additional deployment instructions provide a clear, step-by-step guide to help you deploy your Next.js application in production. They cover stopping the service, building the app, reloading systemd, starting the service again, and configuring Nginx as a reverse proxy. Enjoy developing and deploying your project!