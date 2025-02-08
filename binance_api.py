import asyncio
import json
import os
import time

import pandas as pd
import requests
import websockets
from binance.spot import Spot
from dotenv import load_dotenv
from requests import Response

load_dotenv()
# TODO: Separate API key and secret from the code
api_key = os.environ["BINANCE_API_KEY"]
api_secret = os.environ["BINANCE_SECRET_KEY"]


def get_kucoin_ws_token():
    response = requests.post("https://api.kucoin.com/api/v1/bullet-public")
    if response.status_code != 200:
        raise Exception(f"Error fetching token from KuCoin: {response.text}")
    return response.json()["data"]


async def get_kucoin_candles(symbol="BTC-USDT", interval="1min"):
    token_data = get_kucoin_ws_token()
    token = token_data["token"]
    endpoint = token_data["instanceServers"][0]["endpoint"]
    connect_id = str(int(time.time() * 1000))

    url = f"{endpoint}?token={token}&connectId={connect_id}"
    async with websockets.connect(url) as websocket:
        # Wait for the welcome message
        welcome_message = await websocket.recv()
        print("Welcome message:", welcome_message)

        # Subscribe to the K-Line data
        subscribe_message = {
            "id": connect_id,
            "type": "subscribe",
            "topic": f"/market/candles:{symbol}_{interval}",
            "privateChannel": False,
            "response": True,
        }
        await websocket.send(json.dumps(subscribe_message))

        # Wait for the ack message
        ack_message = await websocket.recv()
        print("Ack message:", ack_message)

        fixed_minute = None  # Track the minute timestamp of the latest finalized candle
        # Process incoming K-Line data
        while True:
            response = await websocket.recv()
            data = json.loads(response)
            if data["type"] == "message" and data["subject"] == "trade.candles.update":
                kline_data = data["data"]["candles"]
                current_time = int(kline_data[0])
                # Floor the timestamp to the minute
                minute_timestamp = current_time - (current_time % 60)
                is_final = False

                # TODO: The principle of Separation of Concerns are not strictly followed here
                # What if it was a different interval?
                # Mark as final only if the floored minute has advanced
                if fixed_minute is None or minute_timestamp > fixed_minute:
                    fixed_minute = minute_timestamp
                    is_final = True

                candle = {
                    "time": int(kline_data[0]),
                    "open": float(kline_data[1]),
                    "close": float(kline_data[2]),
                    "high": float(kline_data[3]),
                    "low": float(kline_data[4]),
                    "volume": float(kline_data[5]),
                    "is_final": is_final,
                }

                yield candle


def get_historical_klines_from_kucoin(
    interval: str = "1m",
    limit: int = 30,
    symbol: str = "BTCUSDT",
) -> pd.DataFrame:
    """
    Retrieves historical kline (candlestick) data from Binance API.
    This function fetches OHLCV (Open, High, Low, Close, Volume) data for a given trading pair
    over a specified time interval.
    Parameters
    ----------
    interval : str, optional
        The interval between klines. Valid values:
        1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 1w, 1M
        Default is "1m"
    limit : int, optional
        Number of klines to retrieve. Default is 30
    symbol : str, optional
        Trading pair symbol (e.g. "BTCUSDT"). Default is "BTCUSDT"
    Returns
    -------
    pandas.DataFrame
        DataFrame containing the following columns:
        - timestamp (float): Unix timestamp in seconds
        - open (float): Opening price
        - high (float): Highest price
        - low (float): Lowest price
        - close (float): Closing price
        - volume (float): Trading volume
    Notes
    -----
    The timestamp is converted from milliseconds to seconds.
    All price and volume values are converted to float64 type.
    """

    interval_mapping = {
        "1m": 60,
        "3m": 180,
        "5m": 300,
        "15m": 900,
        "30m": 1800,
        "1h": 3600,
        "2h": 7200,
        "4h": 14400,
        "6h": 21600,
        "8h": 28800,
        "12h": 43200,
        "1d": 86400,
        "1w": 604800,
        "1M": 2592000,  # Approximation
    }

    if interval not in interval_mapping:
        raise ValueError("Invalid interval")

    # Calculate endAt and startAt
    end_at = int(time.time())
    start_at = end_at - (limit * interval_mapping[interval])

    # Map Binance intervals to KuCoin intervals
    kucoin_interval_mapping = {
        "1m": "1min",
        "3m": "3min",
        "5m": "5min",
        "15m": "15min",
        "30m": "30min",
        "1h": "1hour",
        "2h": "2hour",
        "4h": "4hour",
        "6h": "6hour",
        "8h": "8hour",
        "12h": "12hour",
        "1d": "1day",
        "1w": "1week",
        "1M": "1month",
    }

    if interval not in kucoin_interval_mapping:
        raise ValueError("Invalid interval")
    interval = kucoin_interval_mapping[interval]

    if symbol == "BTCUSDT":
        symbol = "BTC-USDT"

    response = requests.get(
        f"https://api.kucoin.com/api/v1/market/candles?type={interval}"
        f"&symbol={symbol}&startAt={start_at}&endAt={end_at}"
    )

    if response.status_code != 200:
        raise Exception(f"Error fetching data from KuCoin: {response.text}")

    data = response.json()["data"]

    # Convert to DataFrame and select OHLC columns
    df = pd.DataFrame(
        data,
        columns=[
            "timestamp",
            "open",
            "close",
            "high",
            "low",
            "volume",
            "turnover",
        ],
    )

    # Convert timestamp from milliseconds to seconds
    df["timestamp"] = df["timestamp"].astype(float)

    # Convert OHLCV columns to float
    df[["open", "high", "low", "close", "volume"]] = df[
        ["open", "high", "low", "close", "volume"]
    ].astype("float64")

    # Reorder columns to match Binance format
    df = df[["timestamp", "open", "high", "low", "close", "volume"]]

    return df


def get_historical_klines(
    interval: str = "1m",
    limit: int = 30,
    symbol: str = "BTCUSDT",
) -> pd.DataFrame:
    # THIS IS BINANCE API
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
