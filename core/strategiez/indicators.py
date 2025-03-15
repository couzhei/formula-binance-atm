import pandas as pd


def calculate_macd(df, fast_length, slow_length, signal_length):
    df["EMA_fast"] = df["Close"].ewm(span=fast_length, adjust=False).mean()
    df["EMA_slow"] = df["Close"].ewm(span=slow_length, adjust=False).mean()
    df["MACD_line"] = df["EMA_fast"] - df["EMA_slow"]
    df["MACD_signal"] = df["MACD_line"].ewm(span=signal_length, adjust=False).mean()
    df["MACD_hist"] = df["MACD_line"] - df["MACD_signal"]
    return df


def calculate_rsi(df, length):
    delta = df["Close"].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=length).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=length).mean()
    rs = gain / loss
    df["RSI"] = 100 - (100 / (1 + rs))
    return df


def calculate_sma(df, period: int) -> pd.DataFrame:
    return df["close"].rolling(window=period).mean()


def calculate_indicator_signals(df, indicator_name, variables, detect_divergence=False):
    signals = {"indicator": indicator_name, "divergence_detected": False, "side": None}
    if indicator_name == "MACD":
        df = calculate_macd(
            df,
            variables.get("fast_length", 12),
            variables.get("slow_length", 26),
            variables.get("signal_length", 9),
        )
        signals["last_value"] = df["MACD_hist"].iloc[-1]
        # ...existing code...
    elif indicator_name == "RSI":
        df = calculate_rsi(df, variables.get("length", 14))
        signals["last_value"] = df["RSI"].iloc[-1]
        # ...existing code...
    elif indicator_name == "SMA":
        df[f"SMA_{variables.get('period', 21)}"] = calculate_sma(
            df,
            period=variables.get("period", 21),
        )
        signals["last_value"] = df["SMA"].iloc[-1]
    return df, signals
