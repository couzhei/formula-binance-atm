export interface HistoricalData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  MACD_hist: number;
  RSI: number;
  [key: string]: number | string | undefined;
}

export interface Signal {
  timestamp: number;
  price: number;
  type: "BUY" | "SELL";
}

export interface ApiResponse {
  historical_data: HistoricalData[];
  signals: Signal[];
  sma_param: number;
}

export interface RealTimeData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  sma: number | null;
  signal?: "BUY" | "SELL" | null;
  is_final?: boolean;
}
