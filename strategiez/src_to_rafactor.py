import pandas as pd


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


def generate_signals(df):
    # Ensure datetime is in Unix time format
    df["datetime"] = pd.to_datetime(df["timestamp"]).astype(int) // 10**9

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
    # type: "BUY" | "SELL";
    # }
    test_signal = [
        {
            "timestamp": df["timestamp"].iloc[-2],
            "price": df["close"].iloc[-2],
            "type": "BUY",
        },
        {
            "timestamp": df["timestamp"].iloc[-1],
            "price": df["close"].iloc[-1],
            "type": "SELL",
        },
    ]
    return test_signal


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
