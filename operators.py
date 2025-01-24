def cross_over(candles, column="Close", first_indicator=None, second_indicator=None):
    """
    Check if first_indicator and second_indicator functions cross each other.
    If second_indicator is None, check between price and first_indicator.

    Parameters:
    candles (DataFrame): The time-series data containing the candle information.
    column (str): The column name to use for price comparison.
    first_indicator (function): The first indicator function.
    second_indicator (function, optional): The second indicator function.

    Returns:
    bool: True if a crossover is detected, False otherwise.
    """
    if first_indicator is None:
        raise ValueError("first_indicator function must be provided")

    # Calculate the first indicator values
    first_values = first_indicator(candles)

    if second_indicator:
        # Calculate the second indicator values
        second_values = second_indicator(candles)
    else:
        # Use the price column for comparison
        second_values = candles[column]

    # Check for crossover
    for i in range(1, len(candles)):
        if (
            first_values[i - 1] <= second_values[i - 1]
            and first_values[i] > second_values[i]
        ):
            return True
        if (
            first_values[i - 1] >= second_values[i - 1]
            and first_values[i] < second_values[i]
        ):
            return True

    return False
