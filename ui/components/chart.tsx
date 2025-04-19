"use client";
import type { ApiResponse, RealTimeData } from "../types/types";
import {
  Time,
  CandlestickData, // used for typing candles array
  LineStyle,
  LineSeries,
  HistogramSeries,
  CandlestickSeries,
  createChart,
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  SeriesMarker,
  LineData,
  createSeriesMarkers,
  HistogramData,
  LogicalRange,
  IRange,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

// --------------------------------------------------------------------------------
// Constants and Helper Functions
// --------------------------------------------------------------------------------
const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";


type MarkerRef = ISeriesMarkersPluginApi<Time>;

export default function CandlestickChart() {
  // Refs
  const mainChartRef = useRef<HTMLDivElement>(null);
  const macdChartRef = useRef<HTMLDivElement>(null);
  const rsiChartRef = useRef<HTMLDivElement>(null);

  const mainChart = useRef<IChartApi | null>(null);
  const macdChart = useRef<IChartApi | null>(null);
  const rsiChart = useRef<IChartApi | null>(null);

  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const smaSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSeries = useRef<ISeriesApi<"Histogram"> | null>(null);
  const rsiSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const markersRef = useRef<MarkerRef | null>(null);

  const [data, setData] = useState<ApiResponse | null>(null);
  const smaData = useRef<LineData[]>([]);
  const macdData = useRef<HistogramData<Time>[]>([]);
  const rsiData = useRef<LineData<Time>[]>([]);

  useEffect(() => {
    fetch(`${backendUrl}/historical_data`)
      .then((res) => res.json())
      .then((apiData: ApiResponse) => {
        setData(apiData);
        const key = `sma_${apiData.sma_param}`;
        smaData.current = apiData.historical_data
          .map((d) => ({
            time: Math.floor(d.timestamp) as Time,
            value: Number(d[key]),
          }))
          .filter((p) => !isNaN(p.value));

        macdData.current = apiData.historical_data
          .map((d, i, arr) => {
            const value = Number(d.MACD_hist);
            const prevValue = i > 0 ? Number(arr[i - 1].MACD_hist) : value;
            let color = "#888";
            if (i > 0) {
              if (value > 0) {
                color = value > prevValue ? "#00ff00" : "#007700";
              } else {
                color = value < prevValue ? "#ff0000" : "#770000";
              }
            }
            return {
              time: Math.floor(d.timestamp) as Time,
              value,
              color,
            };
          })
          .filter((p) => !isNaN(p.value));
        rsiData.current = apiData.historical_data
          .map((d) => ({
            time: Math.floor(d.timestamp) as Time,
            value: Number(d.RSI),
          }))
          .filter((p) => !isNaN(p.value));
      });
  }, []);

  useEffect(() => {
    if (
      !data ||
      !mainChartRef.current ||
      !macdChartRef.current ||
      !rsiChartRef.current
    )
      return;

    // Main Chart
    mainChart.current = createChart(mainChartRef.current, {
      width: 800,
      height: 400,
    });
    candleSeries.current = mainChart.current.addSeries(CandlestickSeries);
    smaSeries.current = mainChart.current.addSeries(LineSeries, {
      color: "#1b2781",
      lineStyle: LineStyle.Dashed,
    });

    // Use CandlestickData<> for proper typing
    const candles: CandlestickData<Time>[] = data.historical_data.map((d) => ({
      time: Math.floor(d.timestamp) as Time,
      open: Number(d.open),
      high: Number(d.high),
      low: Number(d.low),
      close: Number(d.close),
    }));
    candleSeries.current.setData(candles);
    smaSeries.current.setData(smaData.current);

    // MACD Chart
    macdChart.current = createChart(macdChartRef.current, {
      width: 800,
      height: 150,
    });
    macdSeries.current = macdChart.current.addSeries(HistogramSeries);
    macdSeries.current.setData(macdData.current);

    // RSI Chart
    rsiChart.current = createChart(rsiChartRef.current, {
      width: 800,
      height: 150,
    });
    rsiSeries.current = rsiChart.current.addSeries(LineSeries, {
      color: "#ff9800", // Orange color for the RSI line
      lineWidth: 2,
    });
    rsiSeries.current.setData(rsiData.current);

    // Add vertical lines at 30 & 70
    const lvl30 = rsiChart.current.addSeries(LineSeries, {
      color: "#787B86", // Grey color
      lineStyle: LineStyle.Dotted,
      lineWidth: 1,
    });
    const lvl70 = rsiChart.current.addSeries(LineSeries, {
      color: "#787B86", // Grey color
      lineStyle: LineStyle.Dotted,
      lineWidth: 1,
    });
    lvl30.setData(rsiData.current.map((p) => ({ time: p.time, value: 30 })));
    lvl70.setData(rsiData.current.map((p) => ({ time: p.time, value: 70 })));

    // Sync time scales
    const charts = [
      mainChart.current,
      macdChart.current,
      rsiChart.current,
    ] as IChartApi[];
    charts.forEach((src) => {
      src
        .timeScale()
        .subscribeVisibleLogicalRangeChange((range: LogicalRange | null) => {
          if (!range) return;
          charts
            .filter((c) => c !== src)
            .forEach((c) =>
              c.timeScale().setVisibleLogicalRange(range as IRange<number>)
            );
        });
    });

    // Markers
    if (data.signals?.length) {
      const ms: SeriesMarker<Time>[] = data.signals.map((s) => ({
        time: s.timestamp as Time,
        position: s.type === "BUY" ? "belowBar" : "aboveBar",
        color: s.type === "BUY" ? "#00B4D8" : "#E0AAFF",
        shape: s.type === "BUY" ? "arrowUp" : "arrowDown",
        text: s.type,
      }));
      markersRef.current = createSeriesMarkers(candleSeries.current!, ms);
    } else {
      markersRef.current = createSeriesMarkers(candleSeries.current!, []);
    }

    // WebSocket updates
    const ws = new WebSocket(
      `${backendUrl.startsWith("https") ? "wss" : "ws"}://${backendUrl.replace(
        /^https?:\/\//,
        ""
      )}/ws/kucoin`
    );
    ws.onmessage = (e) => {
      const msg: RealTimeData = JSON.parse(e.data);
      const t = msg.time as Time;

      // Candle + SMA
      candleSeries.current?.update({
        time: t,
        open: msg.open,
        high: msg.high,
        low: msg.low,
        close: msg.close,
      });
      if (msg.is_final && msg.sma != null) {
        // TODO: should later be separated since someone might not be interested in seeing sma or rsi
        smaSeries.current?.update({ time: t, value: Number(msg.sma) });
        lvl30?.update({ time: t, value: 30 });
        lvl70?.update({ time: t, value: 70 });
      }

      // New MACD + RSI
      const prevM = macdData.current[macdData.current.length - 1]?.value ?? 0;
      const newMVal = prevM + (Math.random() - 0.5) * 0.5;
      const newM: HistogramData<Time> = {
        time: t,
        value: Math.round(newMVal * 100) / 100,
        color:
          newMVal > 0
            ? newMVal > prevM
              ? "#00ff00"
              : "#007700"
            : newMVal < prevM
            ? "#ff0000"
            : "#770000",
      };
      macdData.current.push(newM);
      macdSeries.current?.update(newM);

      const newRVal =
        30 + Math.random() * 40 + 10 * Math.sin(macdData.current.length / 10);
      const newR: LineData<Time> = {
        time: t,
        value: Math.round(newRVal * 100) / 100,
      };
      rsiData.current.push(newR);
      rsiSeries.current?.update(newR);

      // markers
      if (msg.signal && markersRef.current) {
        const curr = markersRef.current.markers();
        const nm: SeriesMarker<Time> = {
          time: t,
          position: msg.signal === "BUY" ? "belowBar" : "aboveBar",
          color: msg.signal === "BUY" ? "#00B4D8" : "#E0AAFF",
          shape: msg.signal === "BUY" ? "arrowUp" : "arrowDown",
          text: msg.signal,
        };
        markersRef.current.setMarkers([...curr, nm]);
      }
    };
    return () => {
      ws.close();
      charts.forEach((c) => c.remove());
    };
  }, [data]);

  return (
    <>
      <div ref={mainChartRef} />
      <div ref={macdChartRef} style={{ marginTop: 8 }} />
      <div ref={rsiChartRef} style={{ marginTop: 8 }} />
    </>
  );
}
