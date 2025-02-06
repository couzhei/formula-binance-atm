import pandas as pd
from strategiez.src_to_rafactor import calculate_indicator_signals

def test_calculate_indicator_signals():
    df = pd.DataFrame({"Close": [1, 2, 3, 4, 5]})
    variables = {"fast_length": 12, "slow_length": 26, "signal_length": 9}
    df, signals = calculate_indicator_signals(df, "MACD", variables, detect_divergence=False)
    assert "MACD_line" in df.columns
    assert "MACD_signal" in df.columns
    assert "MACD_hist" in df.columns
    assert "indicator" in signals
