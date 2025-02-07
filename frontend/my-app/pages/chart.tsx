import {
  Time,
  CandlestickData,
  LineStyle,
  createChart,
  IChartApi,
  ISeriesApi,
  SeriesMarker,
  LineData,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

interface HistoricalData {
  timestamp: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  [key: string]: number | string | undefined; // Dynamic key for SMA
}

interface Signal {
  timestamp: number; // Unix timestamp in seconds
  price: number;
  type: "BUY" | "SELL";
}

interface ApiResponse {
  historical_data: HistoricalData[];
  signals: Signal[];
  sma_param: number; // Add SMA parameter to the response interface
}

interface RealTimeData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  sma: number | null; // Add SMA field
  signal?: "BUY" | "SELL" | null;
}

const ChartPage: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | undefined>(undefined);
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | undefined>(undefined);
  const smaSeries = useRef<ISeriesApi<"Line"> | undefined>(undefined);
  const lastProcessedInterval = useRef<number | null>(null); // Define lastProcessedInterval
  const [data, setData] = useState<ApiResponse | null>(null);

  useEffect(() => {
    // Fetch initial historical data
    fetch(`${backendUrl}/historical_data`)
      .then((response) => response.json())
      .then((apiData) => setData(apiData))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    if (chartRef.current && data && !chart.current) {
      // Initialize chart
      chart.current = createChart(chartRef.current, {
        width: 800,
        height: 600,
        layout: {
          background: { color: "#ffffff" },
          textColor: "#333333",
        },
        grid: {
          vertLines: {
            color: "#eeeeee",
          },
          horzLines: {
            color: "#eeeeee",
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
      const candles: CandlestickData<Time>[] = data.historical_data.map(
        (item) => {
          // Ensure timestamp is a number and in seconds
          const timestamp =
            typeof item.timestamp === "string"
              ? parseInt(item.timestamp, 10)
              : item.timestamp;

          return {
            time: timestamp as Time,
            open: Number(item.open),
            high: Number(item.high),
            low: Number(item.low),
            close: Number(item.close),
          };
        }
      );

      // Debug timestamps
      console.log("First candle timestamp:", candles[0]?.time);
      console.log("Last candle timestamp:", candles[candles.length - 1]?.time);

      candleSeries.current.setData(candles);

      // Set visible range to show last 50 candles
      if (candles.length >= 50) {
        chart.current.timeScale().setVisibleRange({
          from: candles[candles.length - 50].time,
          to: candles[candles.length - 1].time,
        });
      } else {
        chart.current.timeScale().fitContent();
      }

      // Add SMA series
      smaSeries.current = chart.current.addLineSeries({
        color: "rgb(27, 39, 129)",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
      });

      // Set SMA data
      const smaKey = `sma_${data.sma_param}`;
      const smaData: LineData[] = data.historical_data.map((item) => ({
        time: typeof item.timestamp === "string" ? parseInt(item.timestamp, 10) : item.timestamp as Time,
        value: item[smaKey] !== null ? Number(item[smaKey]) : NaN,
      }));

      smaSeries.current.setData(smaData);

      const markers: SeriesMarker<Time>[] = data.signals.map((signal) => ({
        time: (typeof signal.timestamp === "string"
          ? parseInt(signal.timestamp, 10)
          : signal.timestamp) as Time,
        position: signal.type === "BUY" ? "belowBar" : "aboveBar",
        color: signal.type === "BUY" ? "green" : "red",
        shape: signal.type === "BUY" ? "arrowUp" : "arrowDown",
        text: signal.type,
      }));

      candleSeries.current.setMarkers(markers);

      // Initialize WebSocket for real-time data
      const webSocketUrl = backendUrl.replace("http://", "")
      const socket = new WebSocket(
        `ws://${webSocketUrl.replace("https://", "")}/ws/kucoin`
      );

      socket.onmessage = (event) => {
        const realTimeData: RealTimeData = JSON.parse(event.data);
        console.log("Real-Time Data received:", realTimeData);

        // Ensure timestamp is in seconds and is a number
        const timestamp = Math.floor(
          typeof realTimeData.time === "string"
            ? parseInt(realTimeData.time, 10)
            : realTimeData.time
        );

        // Debug logging
        const lastBar = candleSeries.current
          ?.data()
          .at(candleSeries.current.data().length - 1);
        console.log("Last candle time:", lastBar?.time);
        console.log("New update time:", timestamp);

        try {
          // Update candlestick with properly formatted time
          candleSeries.current?.update({
            time: timestamp as Time,
            open: realTimeData.open,
            high: realTimeData.high,
            low: realTimeData.low,
            close: realTimeData.close,
          });

          // Update SMA data in the temporary array
          const newSmaData = [...smaData];
          newSmaData.push({
            time: timestamp as Time,
            value: realTimeData.close,
          });

          if (newSmaData.length > data.sma_param) {
            const sum = newSmaData
              .slice(-data.sma_param)
              .reduce((acc, curr) => acc + curr.value, 0);
            const smaValue = sum / data.sma_param;
            newSmaData[newSmaData.length - 1].value = smaValue;
          } else {
            newSmaData[newSmaData.length - 1].value = NaN;
          }

          // Check if we have moved to a new interval
          if (
            lastProcessedInterval.current !== null &&
            timestamp > lastProcessedInterval.current
          ) {
            // Update the SMA series
            smaSeries.current?.setData(newSmaData);

            // Add marker if there's a signal
            if (realTimeData.signal) {
              const marker: SeriesMarker<Time> = {
                time: realTimeData.time as Time, // Use Unix time directly
                position:
                  realTimeData.signal === "BUY" ? "belowBar" : "aboveBar",
                color: realTimeData.signal === "BUY" ? "green" : "red",
                shape: realTimeData.signal === "BUY" ? "arrowUp" : "arrowDown",
                text: realTimeData.signal,
              };

              // Get existing markers and append the new one
              const existingMarkers = candleSeries.current?.markers() || [];
              existingMarkers.push(marker);
              candleSeries.current?.setMarkers(existingMarkers);
            }

            // Update the last processed interval
            lastProcessedInterval.current = timestamp;
          }
        } catch (error) {
          console.error("Error updating candlestick:", error);
          console.error("Update data:", {
            time: timestamp,
            open: realTimeData.open,
            high: realTimeData.high,
            low: realTimeData.low,
            close: realTimeData.close,
          });
        }
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed");
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
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