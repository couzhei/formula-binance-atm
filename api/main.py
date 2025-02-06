import asyncio
import os
from datetime import datetime
from random import uniform

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from binance_api import (
    get_binance_candles,
    get_historical_klines,
    get_historical_klines_from_kucoin,
    get_kucoin_candles,
)
from strategiez.src_to_rafactor import (
    backtest_signals,
    calculate_indicator_signals,
    generate_signals,
)

load_dotenv()

app = FastAPI() # the root path here is not very important (why?)
# Because there are two services actually running through nginx (NextJS and FastAPI)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HISTORICAL_DATA_PATH = os.path.join(BASE_DIR, "tests", "Historical_data.csv")


class CalculateRequest(BaseModel):
    price_data: list
    indicator_name: str
    variables: dict
    detect_divergence: bool = False


class GenerateRequest(BaseModel):
    price_data: list


class BacktestRequest(BaseModel):
    price_data: list
    buy_signals: list
    sell_signals: list
    initial_balance: float = 10000.0


@app.get("/historical_data")
def get_historical_data():
    try:
        # df = get_historical_klines(interval="1m", limit=50)
        df = get_historical_klines_from_kucoin(interval="1m", limit=50)

        df = df.sort_values(by="timestamp", ascending=True)

        # Calculate indicators and generate signals
        df, macd_signals = calculate_indicator_signals(
            df,
            "MACD",
            {"fast_length": 12, "slow_length": 26, "signal_length": 9},
            detect_divergence=True,
        )
        df, rsi_signals = calculate_indicator_signals(
            df, "RSI", {"length": 14}, detect_divergence=True
        )
        buy_signals, sell_signals = generate_signals(df)

        df = (
            df.select_dtypes(include=["float64", "int64"]).astype(str).combine_first(df)
        )

        return {
            "historical_data": df.to_dict(orient="records"),
            "buy_signals": buy_signals,
            "sell_signals": sell_signals,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate")
def calculate(req: CalculateRequest):
    df = pd.DataFrame(req.price_data)

    # Ensure datetime is in Unix time format
    df["datetime"] = pd.to_datetime(df["datetime"]).astype(int) // 10**9

    df, signals = calculate_indicator_signals(
        df, req.indicator_name, req.variables, req.detect_divergence
    )

    # Replace NaN and infinite values
    df = df.replace([float("inf"), -float("inf")], float("nan")).fillna(0)

    signals["last_value"] = 0

    return {"data": df.to_dict(orient="records"), "signals": signals}


@app.websocket("/ws/data")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        async for candle in get_binance_candles(
            symbol="btcusdt",
            interval="1m",
        ):
            real_time_data = {
                "time": candle["time"],
                "open": candle["open"],
                "high": candle["high"],
                "low": candle["low"],
                "close": candle["close"],
                "signal": (
                    "BUY"
                    if candle["is_final"] and candle["close"] > candle["open"]
                    else None
                ),
            }
            await websocket.send_json(real_time_data)
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")


@app.websocket("/ws/kucoin")
async def websocket_kucoin_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        async for candle in get_kucoin_candles(
            symbol="BTC-USDT",
            interval="1min",
        ):
            real_time_data = {
                "time": candle["time"],
                "open": candle["open"],
                "high": candle["high"],
                "low": candle["low"],
                "close": candle["close"],
                "signal": (
                    "BUY"
                    if candle["close"] > candle["open"]
                    else "SELL"
                    if candle["close"] < candle["open"]
                    else None
                ),
            }
            await websocket.send_json(real_time_data)
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")


@app.post("/generate_signals")
def generate(req: GenerateRequest):
    df = pd.DataFrame(req.price_data)
    buy_signals, sell_signals = generate_signals(df)
    return {"buy_signals": buy_signals, "sell_signals": sell_signals}


@app.post("/backtest")
def backtest(req: BacktestRequest):
    df = pd.DataFrame(req.price_data)
    final_balance = backtest_signals(
        df, req.buy_signals, req.sell_signals, req.initial_balance
    )
    return {"final_balance": final_balance}


html = """
<!DOCTYPE html>
<html>
    <head>
        <title>Chat</title>
    </head>
    <body>
        <h1>WebSocket Chat</h1>
        <form action="" onsubmit="sendMessage(event)">
            <input type="text" id="messageText" autocomplete="off"/>
            <button>Send</button>
        </form>
        <ul id='messages'>
        </ul>
        <script>
            var ws = new WebSocket("wss://""" +\
      "chart-api.chickenkiller.com" +\
      """/ws");
            ws.onmessage = function(event) {
                var messages = document.getElementById('messages')
                var message = document.createElement('li')
                var content = document.createTextNode(event.data)
                message.appendChild(content)
                messages.appendChild(message)
            };
            function sendMessage(event) {
                var input = document.getElementById("messageText")
                ws.send(input.value)
                input.value = ''
                event.preventDefault()
            }
        </script>
    </body>
</html>
"""


@app.get("/")
async def get():
    return HTMLResponse(html)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Message text was: {data}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        ssl_keyfile="./localhost.key",
        ssl_certfile="./localhost.crt",
    )