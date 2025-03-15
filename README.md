[![Netlify Status](https://api.netlify.com/api/v1/badges/11b3c195-eb26-4035-bbee-3ed36bcc5601/deploy-status)](https://app.netlify.com/sites/astonishing-klepon-cbc7e9/deploys)

# Formula Binance ATM

Formula Binance ATM is a modular Python and TypeScript project that combines a trading signals backtesting engine, a FastAPI backend, and a Next.js-powered crypto charting interface. It also includes an advanced RSS reader with Windows service support for notifications. This project is designed to support heuristic signal generation, indicator calculation, and historical backtesting – all with an easy-to-deploy structure.

---

## Features

- **Trading Signals and Backtesting**  
  - Generate trading signals using indicator calculations ([`calculate_indicator_signals`](#placeholder)).
  - Separate simple strategy logic from indicator computation using [`generate_signals`](#placeholder).
  - Backtest trading signals with historical data using [`backtest_signals`](#placeholder).

- **API and Web Interface**  
  - Python FastAPI backend ([documentation in `README.md`](README.md)).
  - Next.js crypto trading chart application interface in [frontend/my-app/README.md](frontend/my-app/README.md).

- **RSS Reader with Windows Integration**  
  - A Windows service for an advanced RSS reader implemented with Python ([see steps in `RSS on windows.md`](RSS%20on%20windows.md)).
  - Uses SQLite for feed and entry storage and includes desktop notifications.

---

## Installation

### Prerequisites

- ~~(probably only [`Docker Compose`](https://docs.docker.com/compose/))~~

- [`uv`](https://docs.astral.sh/uv/getting-started/installation/)
- Node.js (v20 recommended for the frontend)

### Running the FastAPI backend

```
uv run -m fastapi run api/main.py
```


### To Do's

 - [ ] [Render](https://render.com/) badget.
 - [ ] Create an automated CI/CD pipeline.
 - [ ] `docker compose` for the dev environment on a single machine.
 - [ ] `.dockerignore` is incomplete, still some unwanted files are lurking around
 - [ ] Testing UI's (a NextJS app) `Dockerfile`
 - [ ] Adds strategies from [Google Sheet](https://docs.google.com/spreadsheets/d/1AYfjHLJVAkbkMQVl1jFvv8SBf9AZV3Ohzh8oyI34KBk/edit?gid=1708701458#gid=1708701458)
 - [ ] Add Apache Kafka service for proper message queueing and real-time analytics
 - [ ] Add agents to create or/and analyze or/and drop strategies over time
 - [ ] Migrate TA-lib from 0.6.3 to an updated version