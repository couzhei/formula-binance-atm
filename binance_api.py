import asyncio
import json
import os

import pandas as pd
import websockets
from binance.spot import Spot

# TODO: Separate API key and secret from the code
api_key = os.environ["BINANCE_API_KEY"]
api_secret = os.environ["BINANCE_SECRET_KEY"]


def get_historical_klines(
    interval: str = "1m",
    limit: int = 30,
    symbol: str = "BTCUSDT",
) -> pd.DataFrame:
    # api key/secret are required for user data endpoints
    client = Spot(
        base_url="https://api2.binance.com", api_key=api_key, api_secret=api_secret
    )

    #  Get candlestick data for BNBUSDT at 1h interval
    klines = client.klines(symbol=symbol, interval=interval, limit=limit)

    # Convert to DataFrame and select OHLC columns
    df = pd.DataFrame(
        klines,
        columns=[
            "timestamp",
            "open",
            "high",
            "low",
            "close",
            "volume",
            "close_time",
            "quote_asset_volume",
            "number_of_trades",
            "taker_buy_base_asset_volume",
            "taker_buy_quote_asset_volume",
            "ignore",
        ],
    )
    ohlc_df = df[["timestamp", "open", "high", "low", "close", "volume"]].copy()

    # Convert timestamp from milliseconds to seconds
    ohlc_df["timestamp"] = ohlc_df["timestamp"].astype(float) // 1000

    # Convert OHLCV columns to float
    ohlc_df[["open", "high", "low", "close", "volume"]] = ohlc_df[
        ["open", "high", "low", "close", "volume"]
    ].astype("float64")

    return ohlc_df


async def get_binance_candles(symbol="btcusdt", interval="3s"):
    url = f"wss://stream.binance.com:9443/ws/{symbol}@kline_{interval}"
    async with websockets.connect(url) as websocket:
        print("In the socket (realtime candles)")
        while True:
            response = await websocket.recv()
            data = json.loads(response)
            kline = data["k"]
            candle = {
                "time": kline["t"],
                "open": float(kline["o"]),
                "high": float(kline["h"]),
                "low": float(kline["l"]),
                "close": float(kline["c"]),
                "is_final": kline["x"],
            }
            yield candle
