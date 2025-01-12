import { CandlestickData, createChart, IChartApi, ISeriesApi, Marker } from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface HistoricalData {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
}

interface Signal {
  timestamp: string;
  close: number;
  type: 'BUY' | 'SELL';
}

interface ApiResponse {
  historical_data: HistoricalData[];
  buy_signals: Signal[];
  sell_signals: Signal[];
}

interface RealTimeData {
  time: string; // Expected to be in "YYYY-MM-DD" format
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
    fetch(`${backendUrl}/historical_data_with_signals`)
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
        },
      });

      candleSeries.current = chart.current.addCandlestickSeries();

      // Prepare candlestick data with UNIX timestamps
      const candles: CandlestickData[] = data.historical_data.map(item => ({
        time: item.Date,
        open: Number(item.Open),
        high: Number(item.High),
        low: Number(item.Low),
        close: Number(item.Close),
      }));

      candleSeries.current.setData(candles);

      const markers: Marker[] = [
        ...data.buy_signals.map(signal => ({
          time: signal.timestamp,
          position: 'belowBar' as const,
          color: 'green',
          shape: 'arrowUp' as const,
          text: 'BUY',
        })),
        ...data.sell_signals.map(signal => ({
          time: signal.timestamp,
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
      const socket = new WebSocket('ws://localhost:8001/ws/data');

      socket.onmessage = (event) => {
        const realTimeData: RealTimeData = JSON.parse(event.data);
        console.log("Real-Time Data:", realTimeData);


        // Debug: Check the timestamp value
        console.log("Converted Timestamp:", realTimeData.time);
        console.log("last candle time:", candles[candles.length - 1].time);

        // Update candlestick
        candleSeries.current?.update({
          time: realTimeData.time,
          open: realTimeData.open,
          high: realTimeData.high,
          low: realTimeData.low,
          close: realTimeData.close,
        });

        // Add marker if there's a signal
        if (realTimeData.signal) {
          const marker: Marker = {
            time: realTimeData.time,
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