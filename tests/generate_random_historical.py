from datetime import datetime, timedelta

import numpy as np
import pandas as pd

# Parameters for synthetic data generation
start_date = datetime(2024, 12, 20)
num_days = 252  # Typical number of trading days in a year
initial_close = 585.25

# Lists to hold generated data
dates = []
closes = []
volumes = []
opens = []
highs = []
lows = []

# Generate data
for i in range(num_days):
    date = start_date - timedelta(days=i)
    dates.append(date.strftime("%m/%d/%Y"))

    # Generate close price using Poisson distribution with Gaussian noise
    if i == 0:
        close_price = initial_close
    else:
        # Poisson distribution to simulate daily price changes
        price_change = np.random.poisson(lam=0) + np.random.normal(
            0, 2
        )  # Adjust lam and stddev as needed
        close_price += price_change

    closes.append(round(close_price, 2))

    # Generate other fields based on close price
    volume = np.random.randint(5000000, 15000000)  # Random volume between 5M and 15M
    open_price = round(
        close_price + np.random.normal(0, 1), 2
    )  # Open price close to the close price
    high_price = round(
        max(open_price, close_price) + np.random.uniform(0, 5), 2
    )  # High price slightly above close or open
    low_price = round(
        min(open_price, close_price) - np.random.uniform(0, 5), 2
    )  # Low price slightly below close or open

    volumes.append(volume)
    opens.append(open_price)
    highs.append(high_price)
    lows.append(low_price)

# Create DataFrame and save to CSV
data = {
    "Date": dates,
    "Close": closes,
    "Volume": volumes,
    "Open": opens,
    "High": highs,
    "Low": lows,
}

df = pd.DataFrame(data)
df.to_csv("synthetic_stock_data.csv", index=False)

print("Synthetic stock data generated and saved to 'synthetic_stock_data.csv'.")
