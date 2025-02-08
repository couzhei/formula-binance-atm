import {
  Time,
  // CandlestickData,
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
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  [key: string]: number | string | undefined;
}

interface Signal {
  timestamp: number;
  price: number;
  type: "BUY" | "SELL";
}

interface ApiResponse {
  historical_data: HistoricalData[];
  signals: Signal[];
  sma_param: number;
}

interface RealTimeData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  sma: number | null;
  signal?: "BUY" | "SELL" | null;
  is_final?: boolean;
}

const ChartPage: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | undefined>(undefined);
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | undefined>(undefined);
  const smaSeries = useRef<ISeriesApi<"Line"> | undefined>(undefined);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [smaData, setSmaData] = useState<LineData[]>([]);

  useEffect(() => {
    if (chartRef.current && data && !chart.current) {
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
          tickMarkFormatter: (time: number) => {
            const date = new Date(time * 1000);
            return date.toLocaleTimeString();
          },
        },
      });

      candleSeries.current = chart.current.addCandlestickSeries();
      smaSeries.current = chart.current.addLineSeries({
        color: "rgb(27, 39, 129)",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
      });

      const candles = data.historical_data.map((item: HistoricalData) => ({
        time: (typeof item.timestamp === "string" ? parseInt(item.timestamp, 10) : item.timestamp) as Time,
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
      }));

      candleSeries.current.setData(candles);

      if (candles.length >= 50) {
        chart.current.timeScale().setVisibleRange({
          from: candles[candles.length - 50].time,
          to: candles[candles.length - 1].time,
        });
      } else {
        chart.current.timeScale().fitContent();
      }

      smaSeries.current.setData(smaData);

      const webSocketUrl = backendUrl.replace("http://", "");
      const socket = new WebSocket(`wss://${webSocketUrl.replace("https://", "")}/ws/kucoin`);

      socket.onmessage = (event) => {
        const realTimeData: RealTimeData = JSON.parse(event.data);
        console.log("Received data:", realTimeData);

        const timestamp = Math.floor(
          typeof realTimeData.time === "string" ? parseInt(realTimeData.time, 10) : realTimeData.time
        );

        candleSeries.current?.update({
          time: timestamp as Time,
          open: realTimeData.open,
          high: realTimeData.high,
          low: realTimeData.low,
          close: realTimeData.close,
        });

        if (realTimeData.is_final && realTimeData.sma !== null) {
          const newSmaPoint = {
            time: timestamp as Time,
            value: realTimeData.sma,
          };

          setSmaData((prev) => {
            const updated = [...prev, newSmaPoint];
            if (data.sma_param && updated.length > data.sma_param) {
              updated.shift();
            }
            smaSeries.current?.setData(updated);
            return updated;
          });

          if (realTimeData.signal) {
            const marker: SeriesMarker<Time> = {
              time: timestamp as Time,
              position: realTimeData.signal === "BUY" ? "belowBar" : "aboveBar",
              color: realTimeData.signal === "BUY" ? "green" : "red",
              shape: realTimeData.signal === "BUY" ? "arrowUp" : "arrowDown",
              text: realTimeData.signal,
            };
            const existingMarkers = candleSeries.current?.markers() || [];
            existingMarkers.push(marker);
            candleSeries.current?.setMarkers(existingMarkers);
          }
        }
      };

      return () => {
        socket.close();
        chart.current?.remove();
      };
    }
  }, [data, smaData]);

  useEffect(() => {
    fetch(`${backendUrl}/historical_data`)
      .then((response) => response.json())
      .then((apiData) => {
        setData(apiData);
        const smaKey = `sma_${apiData.sma_param}`;
        const initialSma = apiData.historical_data.map((item: HistoricalData) => ({
          time: (typeof item.timestamp === "string" ? parseInt(item.timestamp, 10) : item.timestamp) as Time,
          value: item[smaKey] !== null ? Number(item[smaKey]) : NaN,
        }));
        setSmaData(initialSma);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return <div ref={chartRef} />;
};

export default ChartPage;