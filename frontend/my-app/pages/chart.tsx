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

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

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
  const chart = useRef<IChartApi>();
  const candleSeries = useRef<ISeriesApi<"Candlestick">>();
  const smaSeries = useRef<ISeriesApi<"Line">>();
  const [data, setData] = useState<ApiResponse | null>(null);
  const smaData = useRef<LineData[]>([]);
  const pendingSma = useRef<LineData | null>(null);

  useEffect(() => {
    fetch(`${backendUrl}/historical_data`)
      .then((res) => res.json())
      .then((apiData: ApiResponse) => {
        setData(apiData);
        const smaKey = `sma_${apiData.sma_param}`;
        const historicalSma = apiData.historical_data
          .map((item) => ({
            time:
              typeof item.timestamp === "string"
                ? parseInt(item.timestamp, 10)
                : item.timestamp,
            value: Number(item[smaKey]),
          }))
          .filter((point) => !isNaN(point.value));
        smaData.current = historicalSma;
      });
  }, []);

  useEffect(() => {
    if (!chartRef.current || !data) return;

    chart.current = createChart(chartRef.current, {
      width: 800,
      height: 600,
      layout: { background: { color: "#fff" }, textColor: "#333" },
      grid: { vertLines: { color: "#eee" }, horzLines: { color: "#eee" } },
      timeScale: {
        timeVisible: true,
        tickMarkFormatter: (time) =>
          new Date(time * 1000).toLocaleTimeString(),
      },
    });

    candleSeries.current = chart.current.addCandlestickSeries();
    smaSeries.current = chart.current.addLineSeries({
      color: "#1b2781",
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
    });

    const candles: CandlestickData<Time>[] = data.historical_data.map(
      (item) => ({
        time:
          typeof item.timestamp === "string"
            ? parseInt(item.timestamp, 10)
            : item.timestamp,
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
      })
    );
    candleSeries.current.setData(candles);
    smaSeries.current.setData(smaData.current);

    // NEW: Set initial markers from backend signals, if any.
    if (data.signals && data.signals.length > 0) {
      const markers: SeriesMarker<Time>[] = data.signals.map((signal) => ({
        time: signal.timestamp as unknown as Time,
        position: signal.type === "BUY" ? "belowBar" : "aboveBar",
        color: signal.type === "BUY" ? "#00ff00" : "#ff0000",
        shape: signal.type === "BUY" ? "arrowUp" : "arrowDown",
        text: signal.type,
      }));
      candleSeries.current.setMarkers(markers);
    }

    const wsProtocol = backendUrl.startsWith("https") ? "wss://" : "ws://";
    const wsUrl =
      wsProtocol + backendUrl.replace(/https?:\/\//, "") + "/ws/kucoin";
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (e) => {
      const realTimeData: RealTimeData = JSON.parse(e.data);
      // Compute timestamp and convert to string for a proper Time format.
      const timestamp = Math.floor(realTimeData.time);
      const timeVal = timestamp.toString() as Time;

      candleSeries.current?.update({
        time: timeVal,
        open: realTimeData.open,
        high: realTimeData.high,
        low: realTimeData.low,
        close: realTimeData.close,
      });

      if (realTimeData.sma !== null && !isNaN(realTimeData.sma)) {
        if (realTimeData.is_final) {
          if (pendingSma.current) {
            smaData.current = [...smaData.current, pendingSma.current];
            pendingSma.current = null;
          }
          const newPoint = {
            time: timeVal,
            value: realTimeData.sma,
          };
          smaData.current = [...smaData.current, newPoint];
          if (smaData.current.length > data.sma_param) {
            smaData.current.shift();
          }
          smaSeries.current?.setData(smaData.current);
        } else {
          pendingSma.current = {
            time: timeVal,
            value: realTimeData.sma,
          };
        }
      }

      if (realTimeData.signal) {
        const markers = candleSeries.current?.markers() || [];
        // Use timeVal for marker's time
        markers.push({
          time: timeVal,
          position: realTimeData.signal === "BUY" ? "belowBar" : "aboveBar",
          color: realTimeData.signal === "BUY" ? "#00ff00" : "#ff0000",
          shape:
            realTimeData.signal === "BUY" ? "arrowUp" : "arrowDown",
          text: realTimeData.signal,
        });
        candleSeries.current?.setMarkers(markers);
      }
    };

    return () => {
      ws.close();
      chart.current?.remove();
    };
  }, [data]);

  return <div ref={chartRef} />;
};

export default ChartPage;