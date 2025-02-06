## Prerequisites

Ensure you have the following installed on your machine:

- **Node Version Manager (NVM)**: Allows you to manage multiple Node.js versions.

**Installation Steps:**

1. **Install NVM**:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
   ```
   This command downloads and runs the NVM installation script.

2. **Load NVM**:
   After installation, load NVM into your current shell session:
   ```bash
   export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   ```

3. **Install Node.js v20**:
   Use NVM to install and use Node.js version 20:
   ```bash
   nvm install 20
   nvm use 20
   ```

## Project Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-repo/formula-binance-atm.git
   cd formula-binance-atm/frontend/my-app
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Build the Application**:
   ```bash
   npm run build
   ```

4. **Start the Application**:
   ```bash
   npm run start
   ```
   The application will run in production mode. For development, use:
   ```bash
   npm run dev
   ```

## Understanding `chart.tsx`

The `chart.tsx` file is pivotal for rendering cryptocurrency candlestick charts and overlaying trading signals. Here's a breakdown:

### Imports

The file imports essential modules from `lightweight-charts` and React:

- **Lightweight Charts**: Provides functions and types for chart creation.
- **React**: Used for component creation and lifecycle management.

### Interfaces

Defines TypeScript interfaces for data structures:

- **HistoricalData**: Represents past market data.
- **Signal**: Represents trading signals with a timestamp, price, and type (BUY or SELL).
- **ApiResponse**: Structure of the API response containing historical data and signals.
- **RealTimeData**: Represents incoming real-time data, including optional trading signals.

### Component Initialization

The `ChartPage` functional component:

- **Refs**: Utilizes `useRef` to maintain references to the chart container, chart instance, and series.
- **State**: Uses `useState` to manage fetched data.
- **Effect Hooks**:
  - **Data Fetching**: On mount, fetches historical data from the backend.
  - **Chart Initialization**: Once data is available, initializes the chart and series.

### Chart Setup

1. **Chart Creation**:
   ```javascript
   chart.current = createChart(chartRef.current, {
     width: 800,
     height: 600,
     layout: {
       background: { color: "#ffffff" },
       textColor: "#333333",
     },
     grid: {
       vertLines: { color: "#eeeeee" },
       horzLines: { color: "#eeeeee" },
     },
     timeScale: {
       timeVisible: true,
       secondsVisible: false,
       tickMarkFormatter: (time) => {
         const date = new Date(time * 1000);
         return date.toLocaleTimeString();
       },
     },
   });
   ```
   Configures chart dimensions, layout, grid, and time scale.

2. **Candlestick Series**:
   ```javascript
   candleSeries.current = chart.current.addCandlestickSeries();
   ```
   Adds a candlestick series to the chart.

3. **Data Preparation**:
   ```javascript
   const candles = data.historical_data.map((item) => ({
     time: item.timestamp,
     open: item.open,
     high: item.high,
     low: item.low,
     close: item.close,
   }));
   candleSeries.current.setData(candles);
   ```
   Transforms historical data into the format required by the chart and sets it.

### Simple Moving Average (SMA) Calculation

The SMA is calculated to smooth out price data:

1. **Historical Data**:
   ```javascript
   const smaWindowSize = 10;
   const smaData = candles.map((point, index, array) => {
     if (index < smaWindowSize - 1) return { time: point.time, value: NaN };
     const sum = array
       .slice(index - smaWindowSize + 1, index + 1)
       .reduce((acc, curr) => acc + curr.close, 0);
     return { time: point.time, value: sum / smaWindowSize };
   });
   ```
   - **Window Size**: Defines the number of periods for the SMA.
   - **Calculation**: For each data point, sums the closing prices over the window and computes the average.

2. **Real-Time Data**:
```javascript
   const newSmaData = [...smaDataRef.current, { time: timestamp, value: NaN }];
   if (newSmaData.length >= smaWindowSize) {
     const sum = newSmaData
       .slice(newSmaData.length - smaWindowSize)
       .reduce((acc, curr) => acc + curr.value, 0);
     newSmaData[newSmaData.length - 1].value = sum / smaWindowSize;
   }
   smaSeries.current.setData(newSmaData);
   smaDataRef.current = newSmaData;
   ```   
   - **Extends Existing Data**: The new data point is initially set to `NaN`.
   - **SMA Calculation**: Once enough data points are available, calculates the new SMA value.
   - **Updates the Chart**: The updated SMA data is applied to the series.

### Handling Real-Time Data Updates

**WebSocket Connection**  
To fetch real-time market data, we use a WebSocket connection:

```javascript
useEffect(() => {
  const socket = new WebSocket("wss://your-websocket-url");

  socket.onmessage = (event) => {
    const realTimeData = JSON.parse(event.data);
    const { timestamp, open, high, low, close, signal } = realTimeData;

    // Update candlestick series
    candleSeries.current.update({ time: timestamp, open, high, low, close });

    // Update SMA series
    const newSmaData = [...smaDataRef.current, { time: timestamp, value: NaN }];
    if (newSmaData.length >= smaWindowSize) {
      const sum = newSmaData
        .slice(newSmaData.length - smaWindowSize)
        .reduce((acc, curr) => acc + curr.value, 0);
      newSmaData[newSmaData.length - 1].value = sum / smaWindowSize;
    }
    smaSeries.current.setData(newSmaData);
    smaDataRef.current = newSmaData;

    // Display buy/sell signals
    if (signal) {
      const shape = signal === "BUY" ? "arrowUp" : "arrowDown";
      const color = signal === "BUY" ? "green" : "red";
      candleSeries.current.createPriceLine({
        price: close,
        color: color,
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: signal,
      });
    }
  };

  return () => {
    socket.close();
  };
}, []);
```
- **Receives WebSocket Data**: Parses real-time market data.
- **Updates Candlestick Series**: Adds the new data point to the chart.
- **Updates SMA**: Recalculates SMA with incoming price data.
- **Handles Buy/Sell Signals**: Displays arrows on the chart for buy/sell signals.

### Deploy on Netlify
    - Go to [Netlify](https://www.netlify.com/).
    - Click on "New site from Git".
    - Connect your GitHub repository.
    - Configure the build settings:
      - **Build Command**: `npm run build`
      - **Publish Directory**: `.next`
    - Click on "Deploy site" to start the deployment process.


### Best Practices and Additional Tips

1. **Optimize Performance**:  
   - Limit the number of data points on the chart.
   - Use `requestAnimationFrame` for smooth rendering.
   - Throttle WebSocket updates to avoid UI lag.

2. **Improve Scalability**:  
   - Store historical data in local storage to avoid refetching on page reload.
   - Use React Context for managing real-time data across components.

3. **Enhance User Experience**:  
   - Add a loading spinner while fetching initial data.
   - Allow users to switch between different timeframes (1m, 5m, 1h, etc.).
   - Implement dark/light theme options.

4. **Debugging WebSocket Issues**:  
   - Ensure the WebSocket URL is correct.
   - Check for connection errors in the browser console.
   - Reconnect on WebSocket disconnection.

---

This guide should (hopefully) give you a solid foundation to work with **Real-Time Data**, **Candlestick Series**, and **SMA Calculation** in **Next.js** using **Lightweight Charts**. 🚀


Welcome to the team! To help you get started with our application, here's a comprehensive guide covering the essential aspects of our tech stack, focusing on the `chart.tsx` component, and providing tips for both development and production environments.

**Tech Stack Overview**

- **Familiarize Yourself with Lightweight Charts**:
  - Review the official tutorials to understand integration with React. ([tradingview.github.io](https://tradingview.github.io/lightweight-charts/tutorials/react/simple?utm_source=chatgpt.com))

- **Explore React Wrappers**:
  - Consider using React wrappers for Lightweight Charts to simplify integration. ([github.com](https://github.com/trash-and-fire/lightweight-charts-react-wrapper?utm_source=chatgpt.com))

- **Stay Updated with Next.js**:
  - Regularly consult the Next.js documentation for best practices in development and deployment. ([nextjs.org](https://nextjs.org/docs/app/getting-started/installation?utm_source=chatgpt.com))