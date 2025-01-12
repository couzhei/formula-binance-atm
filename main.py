import asyncio
import os
from datetime import datetime
from random import uniform

import pandas as pd
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from strategiez.src_to_rafactor import (
    backtest_signals,
    calculate_indicator_signals,
    generate_signals,
)

app = FastAPI()

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


@app.get("/historical_data_with_signals")
def get_historical_data_with_signals():
    try:
        df = pd.read_csv(HISTORICAL_DATA_PATH)
        # Convert 'Date' to a standard format if necessary
        df["Date"] = pd.to_datetime(df["Date"]).dt.strftime("%Y-%m-%d")
        df = df.sort_values(by="Date", ascending=True)

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

        df = df.select_dtypes(include=["float64"]).astype(str).combine_first(df)

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
    print("WebSocket connection accepted")
    try:
        # Read the last price from historical data
        df = pd.read_csv(HISTORICAL_DATA_PATH)
        df["Date"] = pd.to_datetime(df["Date"])
        df.sort_values(by="Date", ascending=True, inplace=True)
        last_row = df.iloc[-1]
        last_price = float(last_row["Close"])
        current_date = pd.to_datetime(last_row["Date"])  # Convert to datetime

        while True:
            # Generate random price movements (within ±2% of last price)
            price_range = last_price * 0.02
            open_price = last_price + uniform(-price_range, price_range)
            high_price = open_price + uniform(0, price_range)
            low_price = open_price - uniform(0, price_range)
            close_price = uniform(low_price, high_price)

            # Update last price for next iteration
            last_price = close_price

            # Increment date by one day and format it
            current_date = current_date + pd.Timedelta(days=1)

            real_time_data = {
                "time": current_date.strftime("%Y-%m-%d"),
                "open": round(open_price, 2),
                "high": round(high_price, 2),
                "low": round(low_price, 2),
                "close": round(close_price, 2),
                "signal": "BUY" if uniform(0, 1) > 0.8 else None,
            }

            await websocket.send_json(real_time_data)
            print(f"Sent real-time data: {real_time_data}")
            await asyncio.sleep(3)
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
            var ws = new WebSocket("ws://localhost:8001/ws");
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

    uvicorn.run(app, host="0.0.0.0", port=8001)
