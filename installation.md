# Formula Binance ATM

## Getting Started

### Backend

1. Install dependencies:
    ```sh
    pip install -r requirements.txt
    ```

2. Run the backend server:
    ```sh
    uvicorn main:app --reload
    ```

### Frontend

1. Navigate to the [my-app](http://_vscodecontentref_/7) directory:
    ```sh
    cd frontend/my-app
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Run the development server:
    ```sh
    npm run dev
    ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Endpoints

### Calculate Indicator
- **URL:** `/calculate`
- **Method:** `POST`
- **Request Body:**
    ```json
    {
        "price_data": [{"Date": "2024-01-01", "Close": 100}, {"Date": "2024-01-02", "Close": 102}],
        "indicator_name": "MACD",
        "variables": {"fast_length": 12, "slow_length": 26, "signal_length": 9},
        "detect_divergence": false
    }
    ```
- **Response:**
    ```json
    {
        "data": [...],
        "signals": {...}
    }
    ```

### Generate Signals
- **URL:** `/generate_signals`
- **Method:** `POST`
- **Request Body:**
    ```json
    {
        "price_data": [...]
    }
    ```
- **Response:**
    ```json
    {
        "buy_signals": [...],
        "sell_signals": [...]
    }
    ```

### Backtest
- **URL:** `/backtest`
- **Method:** `POST`
- **Request Body:**
    ```json
    {
        "price_data": [...],
        "buy_signals": [...],
        "sell_signals": [...],
        "initial_balance": 10000.0
    }
    ```
- **Response:**
    ```json
    {
        "final_balance": 10500.0
    }
    ```

### WebSocket for Real-Time Data
- **URL:** `ws://localhost:8001/ws/data`
- **Message Format:**
    ```json
    {
        "time": "2024-01-03",
        "open": 103.0,
        "high":    {
        "time": "2024-01-03",
        "open": 103.0,
        "high":
    ```