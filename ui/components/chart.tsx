"use client";
import type { ApiResponse, RealTimeData } from "@/lib/types";
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

export default function CandlestickChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const smaSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const smaData = useRef<LineData[]>([]);
  const pendingSma = useRef<LineData | null>(null);
  console.log(data);

  useEffect(() => {
    fetch(`${backendUrl}/historical_data`)
      .then((res) => res.json())
      .then((apiData: ApiResponse) => {
        setData(apiData);
        const smaKey = `sma_${apiData.sma_param}`;

        const historicalSma = apiData.historical_data
          .map((item) => ({
            time: Math.floor(item.timestamp) as Time,
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
        tickMarkFormatter: (time: number) =>
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
        time: Math.floor(item.timestamp) as Time,
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
      const {
        time,
        close,
        open,
        low,
        high,
        sma,
        is_final,
        signal,
      }: RealTimeData = JSON.parse(e.data);

      candleSeries.current?.update({
        time: time as Time,
        open,
        high,
        low,
        close,
      });

      if (sma !== null && !isNaN(sma)) {
        if (is_final) {
          if (pendingSma.current) {
            pendingSma.current = null;
          }
          const newPoint = {
            time: time as Time,
            value: Number(sma),
          };
          if (smaData.current.length > data.sma_param) {
            smaData.current.shift();
          }
          try {
            smaSeries.current!.update(newPoint);
          } catch (e) {
            console.log(e);
          }
        } else {
          pendingSma.current = {
            time: time as Time,
            value: sma,
          };
        }
      }

      if (signal) {
        const markers = candleSeries.current?.markers() || [];
        // Use timeVal for marker's time
        markers.push({
          time: time as Time,
          position: signal === "BUY" ? "belowBar" : "aboveBar",
          color: signal === "BUY" ? "#00ff00" : "#ff0000",
          shape: signal === "BUY" ? "arrowUp" : "arrowDown",
          text: signal,
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
}
