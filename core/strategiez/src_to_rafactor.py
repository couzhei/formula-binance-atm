import pandas as pd

from core.strategiez.indicators import calculate_sma


def calculate_indicator_signals(
    df: pd.DataFrame, indicator_name, variables, detect_divergence=False
):
    """
    Calculate indicator signals for a given financial data and indicator type.

    Parameters:
    df (pd.DataFrame): A DataFrame containing financial data with at least a 'Close' column.
    indicator_name (str): The name of the indicator to calculate. Supported values are 'MACD' and 'RSI'.
    variables (dict): A dictionary containing indicator-specific parameters. For 'MACD', it includes
                      'fast_length', 'slow_length', and 'signal_length'. For 'RSI', it includes 'length'.
    detect_divergence (bool, optional): A flag indicating whether to detect divergence. Defaults to False.

    Returns:
    Tuple[pd.DataFrame, dict]: A tuple containing the modified DataFrame with calculated indicator columns and
                               a dictionary of signals with keys 'indicator', 'divergence_detected', 'side',
                               and 'last_value'.
    """
    signals = {"indicator": indicator_name, "divergence_detected": False, "side": None}

    if indicator_name == "MACD":
        fast_length = variables.get("fast_length", 12)
        slow_length = variables.get("slow_length", 26)
        signal_length = variables.get("signal_length", 9)

        df["EMA_fast"] = df["close"].ewm(span=fast_length, adjust=False).mean()
        df["EMA_slow"] = df["close"].ewm(span=slow_length, adjust=False).mean()
        df["MACD_line"] = df["EMA_fast"] - df["EMA_slow"]
        df["MACD_signal"] = df["MACD_line"].ewm(span=signal_length, adjust=False).mean()
        df["MACD_hist"] = df["MACD_line"] - df["MACD_signal"]
        signals["last_value"] = df["MACD_hist"].iloc[-1]

        if detect_divergence:
            if df["MACD_hist"].iloc[-1] > 0 and df["MACD_hist"].iloc[-2] <= 0:
                signals["divergence_detected"] = True
                signals["side"] = "BUY"
            elif df["MACD_hist"].iloc[-1] < 0 and df["MACD_hist"].iloc[-2] >= 0:
                signals["divergence_detected"] = True
                signals["side"] = "SELL"

    elif indicator_name == "RSI":
        length = variables.get("length", 14)
        delta = df["close"].diff()
        print("We're okay")

        gain = (delta.where(delta > 0, 0)).rolling(window=length).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=length).mean()
        rs = gain / loss
        df["RSI"] = 100 - (100 / (1 + rs))
        signals["last_value"] = df["RSI"].iloc[-1]

        if detect_divergence:
            if df["RSI"].iloc[-1] < 30:
                signals["divergence_detected"] = True
                signals["side"] = "BUY"
            elif df["RSI"].iloc[-1] > 70:
                signals["divergence_detected"] = True
                signals["side"] = "SELL"

    return df, signals


def generate_signals(
    df,
    settings=None,  # : Settings, type hinting creates circular import
):
    # Ensure datetime is in Unix time format

    # for i in range(len(df)):
    #     if i < 1:
    #         continue
    #     rsi_value = df.get("RSI", [None])[i]
    #     macd_hist = df.get("MACD_hist", [None])[i]

    #     if rsi_value is not None and macd_hist is not None:
    #         if rsi_value < 30 and macd_hist > 0:
    #             buy_signals.append((df["datetime"].iloc[i], df["close"].iloc[i], "BUY"))
    #         elif rsi_value > 70 and macd_hist < 0:
    #             sell_signals.append(
    #                 (df["datetime"].iloc[i], df["close"].iloc[i], "SELL")
    #             )
    #### PAY ATTENTION TO THE FORMAT!!!
    # interface Signal {
    # timestamp: number; // Unix timestamp in seconds
    # price: number;
    # type: "BUY" | "SELL"; # aka SIDE
    # }
    # signal = None
    # if is_final:
    #     historical_closes.append(candle["close"])
    #     historical_highs.append(candle["high"])
    #     historical_lows.append(candle["low"])
    #     historical_closes.pop(0)
    #     historical_highs.pop(0)
    #     historical_lows.pop(0)
    #     current_sma = sum(historical_closes) / len(historical_closes)
    #     if candle["high"] > current_sma and current_sma > candle["low"]:
    #         if current_sma < candle["close"] and all(
    #             current_sma > high for high in historical_highs
    #         ):
    #             signal = "BUY"
    #         elif current_sma > candle["close"] and all(
    #             current_sma < low for low in historical_lows
    #         ):
    #             signal = "SELL"

    sma_window = settings.sma_window if settings else 50
    df["sma"] = calculate_sma(df, sma_window)

    # Main condition: current high above sma and low below sma
    main_cond = (df["high"] > df["sma"]) & (df["low"] < df["sma"])

    # For rolling window conditions, shift by 1 to exclude current row.
    # BUY condition: sma.<close AND all previous 3 sma > previous 3 high
    sma_prev_min = df["sma"].shift(1).rolling(window=3, min_periods=3).min()
    high_prev_max = df["high"].shift(1).rolling(window=3, min_periods=3).max()
    buy_cond = (df["sma"] < df["close"]) & (sma_prev_min > high_prev_max)

    # SELL condition: sma > close AND all previous 3 sma < previous 3 low
    sma_prev_max = df["sma"].shift(1).rolling(window=3, min_periods=3).max()
    low_prev_min = df["low"].shift(1).rolling(window=3, min_periods=3).min()
    sell_cond = (df["sma"] > df["close"]) & (sma_prev_max < low_prev_min)

    # Combine with the overall main condition
    buy_signals = main_cond & buy_cond
    sell_signals = main_cond & sell_cond

    # Create a signals list of dictionaries
    signals = []
    # We use .loc to filter rows where signals occur.
    for idx, row in df.loc[buy_signals].iterrows():
        signals.append(
            {
                "timestamp": float(row["timestamp"]),
                "price": row["close"],
                "type": "BUY",
            }
        )

    for idx, row in df.loc[sell_signals].iterrows():
        signals.append(
            {
                "timestamp": float(row["timestamp"]),
                "price": row["close"],
                "type": "SELL",
            }
        )

    # Optionally, sort signals by timestamp:
    signals.sort(key=lambda x: x["timestamp"])
    return signals


def backtest_signals(df, buy_signals, sell_signals, initial_balance=10000):
    # Ensure datetime is in Unix time format
    df["datetime"] = pd.to_datetime(df["datetime"]).astype(int) // 10**9
    balance = initial_balance
    position = None

    for date, price, signal in sorted(buy_signals + sell_signals, key=lambda x: x[0]):
        if signal == "BUY" and position is None:
            position = (price, date)
        elif signal == "SELL" and position is not None:
            buy_price, _ = position
            profit = price - buy_price
            balance += profit
            position = None

    if position is not None:
        last_price = df["close"].iloc[-1]
        buy_price, _ = position
        balance += last_price - buy_price

    return balance
