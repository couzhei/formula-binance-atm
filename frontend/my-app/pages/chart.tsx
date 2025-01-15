import { CandlestickData, createChart, IChartApi, ISeriesApi, Marker } from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface HistoricalData {
  timestamp: number;  // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Signal {
  timestamp: number;  // Unix timestamp in seconds
  price: number;
  type: 'BUY' | 'SELL';
}

interface ApiResponse {
  historical_data: HistoricalData[];
  buy_signals: Signal[];
  sell_signals: Signal[];
}

interface RealTimeData {
  time: number;  // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  signal?: 'BUY' | 'SELL' | null;
}

const ChartPage: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi>();
  const candleSeries = useRef<ISeriesApi<'Candlestick'>>();
  const [data, setData] = useState<ApiResponse | null>(null);

  useEffect(() => {
    // Fetch initial historical data
    fetch(`${backendUrl}/historical_data`)
      .then(response => response.json())
      .then(apiData => setData(apiData))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  useEffect(() => {
    if (chartRef.current && data && !chart.current) {
      // Initialize chart
      chart.current = createChart(chartRef.current, {
        width: 800,
        height: 600,
        layout: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
        },
        grid: {
          vertLines: {
            color: '#eeeeee',
          },
          horzLines: {
            color: '#eeeeee',
          },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          tickMarkFormatter: (time: number) => {
            const date = new Date(time * 1000);
            return date.toLocaleTimeString();
          },
        },
      });

      candleSeries.current = chart.current.addCandlestickSeries();

      // Prepare candlestick data with UNIX timestamps
      const candles: CandlestickData[] = data.historical_data.map(item => {
        // Ensure timestamp is a number and in seconds
        const timestamp = typeof item.timestamp === 'string' 
          ? parseInt(item.timestamp, 10)
          : item.timestamp;
          
        return {
          time: timestamp,
          open: Number(item.open),
          high: Number(item.high),
          low: Number(item.low),
          close: Number(item.close),
        };
      });

      // Debug timestamps
      console.log('First candle timestamp:', candles[0]?.time);
      console.log('Last candle timestamp:', candles[candles.length - 1]?.time);

      candleSeries.current.setData(candles);

      const markers: Marker[] = [
        ...data.buy_signals.map(signal => ({
          time: typeof signal.timestamp === 'string' 
            ? parseInt(signal.timestamp, 10) 
            : signal.timestamp,
          position: 'belowBar' as const,
          color: 'green',
          shape: 'arrowUp' as const,
          text: 'BUY',
        })),
        ...data.sell_signals.map(signal => ({
          time: typeof signal.timestamp === 'string' 
            ? parseInt(signal.timestamp, 10) 
            : signal.timestamp,
          position: 'aboveBar' as const,
          color: 'red',
          shape: 'arrowDown' as const,
          text: 'SELL',
        })),
      ];

      candleSeries.current.setMarkers(markers);

      // Set visible range to show last 50 candles
      if (candles.length >= 50) {
        chart.current.timeScale().setVisibleRange({
          from: candles[candles.length - 50].time,
          to: candles[candles.length - 1].time,
        });
      } else {
        chart.current.timeScale().fitContent();
      }

      // Initialize WebSocket for real-time data
      const socket = new WebSocket(`ws://${backendUrl.replace('http://', '')}/ws/data`);

      socket.onmessage = (event) => {
        const realTimeData: RealTimeData = JSON.parse(event.data);
        console.log("Real-Time Data received:", realTimeData);

        // Ensure timestamp is in seconds and is a number
        const timestamp = Math.floor(
          typeof realTimeData.time === 'string' 
            ? parseInt(realTimeData.time, 10) 
            : realTimeData.time
        );

        // Debug logging
        const lastBar = candleSeries.current?.data().at(candleSeries.current.data().length - 1);
        console.log('Last candle time:', lastBar?.time);
        console.log('New update time:', timestamp);

        try {
          // Update candlestick with properly formatted time
          candleSeries.current?.update({
            time: timestamp as number,
            open: realTimeData.open,
            high: realTimeData.high,
            low: realTimeData.low,
            close: realTimeData.close,
          });
        } catch (error) {
          console.error('Error updating candlestick:', error);
          console.error('Update data:', {
            time: timestamp,
            open: realTimeData.open,
            high: realTimeData.high,
            low: realTimeData.low,
            close: realTimeData.close,
          });
        }

        // Add marker if there's a signal
        if (realTimeData.signal) {
          const marker: Marker = {
            time: realTimeData.time,  // Use Unix time directly
            position: realTimeData.signal === 'BUY' ? 'belowBar' : 'aboveBar',
            color: realTimeData.signal === 'BUY' ? 'green' : 'red',
            shape: realTimeData.signal === 'BUY' ? 'arrowUp' : 'arrowDown',
            text: realTimeData.signal,
          };

          // Get existing markers and append the new one
          const existingMarkers = candleSeries.current?.markers() || [];
          existingMarkers.push(marker);
          candleSeries.current?.setMarkers(existingMarkers);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed');
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return () => {
        socket.close();
        chart.current?.remove();
      };
    }
  }, [data]);

  return <div ref={chartRef} />;
};

export default ChartPage;