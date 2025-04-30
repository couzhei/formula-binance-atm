Great, I’ll gather Python-based, open-source implementations and strategies for detecting both classic chart patterns (like Head & Shoulders, Double Tops, etc.) and harmonic/geometric patterns (like Gartley, Butterfly, AB=CD) with a focus on identifying separate BUY and SELL signals. I’ll also ensure compatibility with 5-minute BTC/USDT candlestick data via the `ccxt` library, and consider options suitable for both real-time detection and backtesting.

I’ll let you know once I have a comprehensive overview ready.

# Chart Pattern Detection Libraries (Classic Patterns)

A variety of open-source Python libraries can identify classical chart patterns (Head & Shoulders, Double/Triple Tops/Bottoms, Triangles, Flags, Wedges, etc.).  For example, **PatternPy** is a Pandas/Numpy-based package that “effortlessly identify[s] intricate patterns like the head and shoulder, multiple tops and bottoms, horizontal support and resistance, and many more” in OHLC data ([GitHub - keithorange/PatternPy:  PatternPy: A Python package revolutionizing trading analysis with high-speed pattern recognition, leveraging Pandas & Numpy. Effortlessly spot Head & Shoulders, Tops & Bottoms, Supports & Resistances. For experts & beginners. #TradingMadeEasy ](https://github.com/keithorange/PatternPy#:~:text=PatternPy%20is%20a%20powerful%20Python,many%20more%20from%20OHLCV%20data)).  In PatternPy one can simply call, e.g.: 
```python
from patternpy.tradingpatterns import head_and_shoulders
df = head_and_shoulders(df)  # Adds a 'head_shoulder_pattern' column
``` 
which labels each detection as `'Head and Shoulder'` or `'Inverse Head and Shoulder'` ([GitHub - keithorange/PatternPy:  PatternPy: A Python package revolutionizing trading analysis with high-speed pattern recognition, leveraging Pandas & Numpy. Effortlessly spot Head & Shoulders, Tops & Bottoms, Supports & Resistances. For experts & beginners. #TradingMadeEasy ](https://github.com/keithorange/PatternPy#:~:text=,df)).  Other libraries cover similar patterns: the **chart_patterns** package (by zeta-zetra) automates detection of ascending/descending triangles, head & shoulders, flags/pennants, and double tops/bottoms ([GitHub - zeta-zetra/chart_patterns: Automate the detection of chart patterns](https://github.com/zeta-zetra/chart_patterns#:~:text=ChartPatterns%20,of%20chart%20patterns%20with%20Python)) ([GitHub - zeta-zetra/chart_patterns: Automate the detection of chart patterns](https://github.com/zeta-zetra/chart_patterns#:~:text=Here%20is%20a%20list%20of,available%20chart%20patterns)).  Likewise **TradingPatternScanner** (a.k.a. `tradingpattern`) detects complex patterns like head & shoulders, wedges, channels, triangles, and multiple tops/bottoms ([tradingpattern · PyPI](https://pypi.org/project/tradingpattern/#:~:text=Trading%20Pattern%20Scanner%20Identifies%20complex,shoulder%2C%20wedge%20and%20many%20more)) ([GitHub - white07S/TradingPatternScanner: Trading Pattern Scanner Identifies complex patterns like head and shoulder, wedge and many more.](https://github.com/white07S/TradingPatternScanner#:~:text=,upper%20trendline%20being%20resistance%20and)).  The **stock-pattern** CLI tool by BennyThadikaran can scan for many common patterns (and even plots them); its README explicitly notes support for both “common chart patterns” and Harmonic patterns ([GitHub - BennyThadikaran/stock-pattern: A Python CLI tool to scan, detect, and plot stock chart patterns](https://github.com/BennyThadikaran/stock-pattern#:~:text=Stock)).  These libraries typically operate on OHLC DataFrames and tag pattern names, which can then be mapped to trade signals (e.g. H&S → sell, inverse H&S → buy). 

Many of these pattern detectors are vectorized (using Pandas/Numpy) for speed.  For example, TradingPatternScanner is “designed for fast performance” using only Pandas/Numpy ([GitHub - white07S/TradingPatternScanner: Trading Pattern Scanner Identifies complex patterns like head and shoulder, wedge and many more.](https://github.com/white07S/TradingPatternScanner#:~:text=Designed%20for%20fast%20performance%3A)).  They often allow configuration of detection windows or thresholds.  Since TA-Lib’s built-in pattern recognition is limited to candlestick formations (CDL* functions) ([TA-Lib](https://ta-lib.github.io/ta-lib-python/func_groups/pattern_recognition.html#:~:text=Pattern%20Recognition%20Functions)) ([TA-Lib](https://ta-lib.github.io/ta-lib-python/func_groups/pattern_recognition.html#:~:text=CDLDOJI%20)) and does *not* include multi-leg chart patterns like head & shoulders or harmonic XABCD patterns, these specialized libraries provide the needed functionality.  (TA-Lib can still be used for related tasks like computing pivot points or ZigZag swings as a preprocessing step, but pattern matching must be done separately.) 

**Key tools for classical patterns:** 

- **PatternPy** – high-speed Pandas/Numpy chart-pattern detector (Head&Shoulder, multiple tops/bottoms, triangles, wedges, etc.) ([GitHub - keithorange/PatternPy:  PatternPy: A Python package revolutionizing trading analysis with high-speed pattern recognition, leveraging Pandas & Numpy. Effortlessly spot Head & Shoulders, Tops & Bottoms, Supports & Resistances. For experts & beginners. #TradingMadeEasy ](https://github.com/keithorange/PatternPy#:~:text=PatternPy%20is%20a%20powerful%20Python,many%20more%20from%20OHLCV%20data)) ([GitHub - keithorange/PatternPy:  PatternPy: A Python package revolutionizing trading analysis with high-speed pattern recognition, leveraging Pandas & Numpy. Effortlessly spot Head & Shoulders, Tops & Bottoms, Supports & Resistances. For experts & beginners. #TradingMadeEasy ](https://github.com/keithorange/PatternPy#:~:text=Once%20installed%20and%20imported%2C%20you,use%20PatternPy%20as%20follows)).  
- **chart_patterns** (zeta-zetra) – identifies doubles (tops/bottoms), flags, pennants, head-&-shoulders, triangles, etc. ([GitHub - zeta-zetra/chart_patterns: Automate the detection of chart patterns](https://github.com/zeta-zetra/chart_patterns#:~:text=ChartPatterns%20,of%20chart%20patterns%20with%20Python)) ([GitHub - zeta-zetra/chart_patterns: Automate the detection of chart patterns](https://github.com/zeta-zetra/chart_patterns#:~:text=Here%20is%20a%20list%20of,available%20chart%20patterns)).  
- **TradingPatternScanner** (`tradingpattern` on PyPI) – scans for head/shoulder, wedges, channels, double tops/bottoms, etc. ([tradingpattern · PyPI](https://pypi.org/project/tradingpattern/#:~:text=Trading%20Pattern%20Scanner%20Identifies%20complex,shoulder%2C%20wedge%20and%20many%20more)) ([GitHub - white07S/TradingPatternScanner: Trading Pattern Scanner Identifies complex patterns like head and shoulder, wedge and many more.](https://github.com/white07S/TradingPatternScanner#:~:text=,upper%20trendline%20being%20resistance%20and)).  
- **stock-pattern** (BennyThadikaran) – CLI tool to detect/chart patterns (including plotting). Supports harmonic patterns too ([GitHub - BennyThadikaran/stock-pattern: A Python CLI tool to scan, detect, and plot stock chart patterns](https://github.com/BennyThadikaran/stock-pattern#:~:text=Stock)).  
- **TA-Lib** (Python wrapper) – **candlestick** pattern functions (e.g. CDLENGULFING, CDLDOJI, etc.) ([TA-Lib](https://ta-lib.github.io/ta-lib-python/func_groups/pattern_recognition.html#:~:text=Pattern%20Recognition%20Functions)) ([TA-Lib](https://ta-lib.github.io/ta-lib-python/func_groups/pattern_recognition.html#:~:text=CDLDOJI%20)). Useful for candlestick signals, but *not* for multi-bar chart patterns or harmonic patterns.

Each library returns pattern labels (often including bullish/bearish variants).  For example, PatternPy’s `head_and_shoulders` adds a column with `'Head and Shoulder'` (bearish) or `'Inverse Head and Shoulder'` (bullish) ([GitHub - keithorange/PatternPy:  PatternPy: A Python package revolutionizing trading analysis with high-speed pattern recognition, leveraging Pandas & Numpy. Effortlessly spot Head & Shoulders, Tops & Bottoms, Supports & Resistances. For experts & beginners. #TradingMadeEasy ](https://github.com/keithorange/PatternPy#:~:text=,df)), which can directly drive sell vs. buy signals.  Similarly, double-top vs double-bottom functions (in chart_patterns or others) yield separate signals for bearish/bullish reversals.  In practice, one would run the desired detectors on the 5-min BTC/USDT OHLC DataFrame (see below) and then map each pattern label to a BUY or SELL signal according to its conventional interpretation.

## Harmonic Pattern Detection (Harmonic/Geometric Patterns)

Harmonic chart patterns (Gartley, Butterfly, Bat, Crab, Shark, AB=CD, etc.) require specialized libraries, as they rely on Fibonacci-based swing ratios. A leading open-source solution is **PyHarmonics**, a comprehensive Python library for detecting and plotting harmonic patterns in OHLC data ([Pyharmonics documentation — Pyharmonics 1.4.4 documentation](https://pyharmonics.readthedocs.io/#:~:text=Pyharmonics%20detects%20harmonic%20patterns%20in,follow%20author%20Scott%20Carney%20yourself)).  PyHarmonics provides classes like `HarmonicSearch` that scan price swings (often using ZigZag pivots) for XABCD structures; e.g.: 
```python
from pyharmonics.search import HarmonicSearch
hs = HarmonicSearch(df)
hs.search()
patterns = hs.get_patterns(family=hs.XABCD)
```
PyHarmonics can identify all standard patterns (Gartley, Bat, Butterfly, Crab, Shark, AB=CD, etc.) on any timeframe ([Pyharmonics documentation — Pyharmonics 1.4.4 documentation](https://pyharmonics.readthedocs.io/#:~:text=Pyharmonics%20detects%20harmonic%20patterns%20in,follow%20author%20Scott%20Carney%20yourself)) ([Pyharmonics documentation — Pyharmonics 1.4.4 documentation](https://pyharmonics.readthedocs.io/#:~:text=1,m.search)). It even distinguishes “formed” vs “forming” patterns and can plot them via its Plotter class ([Pyharmonics documentation — Pyharmonics 1.4.4 documentation](https://pyharmonics.readthedocs.io/#:~:text=1,m.search)). 

Another open-source library is **HarmonicPatterns** (by djoffrey), which “filters ZigZag patterns that fit-in Harmonic Patterns” ([GitHub - djoffrey/HarmonicPatterns: A library written in Python to search harmonic patterns automatically.](https://github.com/djoffrey/HarmonicPatterns#:~:text=In%20short%2C%20this%20project%20filters,in%20Harmonic%20Patterns)). Its README explicitly lists supported patterns: ABCD, Gartley, Bat, AltBat, Butterfly, Crab, DeepCrab, Shark, and “Cypper” (likely typo for “Cypher”) ([GitHub - djoffrey/HarmonicPatterns: A library written in Python to search harmonic patterns automatically.](https://github.com/djoffrey/HarmonicPatterns#:~:text=)).  Like PyHarmonics, it builds upon TA-Lib ZigZag or similar pivot rules and flags harmonic pattern formations.  For example, it can “draw Harmonic Patterns in the graph” and even **predict** potential completion points using its deep search routines ([GitHub - djoffrey/HarmonicPatterns: A library written in Python to search harmonic patterns automatically.](https://github.com/djoffrey/HarmonicPatterns#:~:text=)). 

The **stock-pattern** scanner mentioned above also includes harmonic scanning; its documentation shows examples of detecting “Bull BAT” patterns in stock data ([GitHub - BennyThadikaran/stock-pattern: A Python CLI tool to scan, detect, and plot stock chart patterns](https://github.com/BennyThadikaran/stock-pattern#:~:text=Image%3A%20HUDCO%20)). 

Since TA-Lib does not natively support harmonic patterns, these third-party libraries are essential.  Both PyHarmonics and HarmonicPatterns are open-source (MIT-licensed or similar) and can be integrated into backtesting or live systems.  PyHarmonics even has market-data helpers (for Binance, Alpaca, etc.) to fetch and format data ([Pyharmonics documentation — Pyharmonics 1.4.4 documentation](https://pyharmonics.readthedocs.io/#:~:text=%24%20git%20clone%20git%40github.com%3Aniall,marketdata%20import%20BinanceCandleData)), though one can just feed it any Pandas DataFrame. 

**Key tools for harmonic patterns:** 

- **PyHarmonics** – Detects all standard harmonic XABCD patterns in OHLC data (for stocks or crypto) ([Pyharmonics documentation — Pyharmonics 1.4.4 documentation](https://pyharmonics.readthedocs.io/#:~:text=Pyharmonics%20detects%20harmonic%20patterns%20in,follow%20author%20Scott%20Carney%20yourself)).  Offers classes to search and plot patterns on any timeframe ([Pyharmonics documentation — Pyharmonics 1.4.4 documentation](https://pyharmonics.readthedocs.io/#:~:text=1,m.search)).  
- **HarmonicPatterns** (djoffrey) – Scans ZigZag pivot patterns for Gartley/Butterfly/Crab/Shark/etc., with support for prediction and visualization ([GitHub - djoffrey/HarmonicPatterns: A library written in Python to search harmonic patterns automatically.](https://github.com/djoffrey/HarmonicPatterns#:~:text=In%20short%2C%20this%20project%20filters,in%20Harmonic%20Patterns)) ([GitHub - djoffrey/HarmonicPatterns: A library written in Python to search harmonic patterns automatically.](https://github.com/djoffrey/HarmonicPatterns#:~:text=)).  
- **stock-pattern** – Also supports basic harmonic pattern detection (as noted in docs ([GitHub - BennyThadikaran/stock-pattern: A Python CLI tool to scan, detect, and plot stock chart patterns](https://github.com/BennyThadikaran/stock-pattern#:~:text=Stock))).  

These libraries output pattern occurrences (with price indexes), which you can interpret as bullish or bearish signals depending on the pattern (e.g. a completed bullish Bat/Gartley suggests a buy opportunity).  Users must still code the entry/exit logic (e.g. enter on leg-D completion and stop at pattern invalidation), since these libraries only flag patterns. 

## Data Integration with CCXT (5-min BTC/USDT)

All of the above tools operate on OHLC (candlestick) data, so the first step is to retrieve 5-minute BTC/USDT candles via CCXT and prepare a DataFrame. For example, using Binance via CCXT: 

```python
import ccxt, pandas as pd
exchange = ccxt.binance()
bars = exchange.fetch_ohlcv('BTC/USDT', timeframe='5m', limit=1000)
# Convert to Pandas DataFrame
df = pd.DataFrame(bars, columns=['timestamp','open','high','low','close','volume'])
df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
df = df.set_index('timestamp')
```

This yields a DataFrame `df` with 5-min OHLCV data suitable for pattern analysis.  We can then pass `df` into any pattern-detection function. For example, applying PatternPy’s head/shoulder detector: 
```python
from patternpy.tradingpatterns import head_and_shoulders
df = head_and_shoulders(df)  # adds 'head_shoulder_pattern' label column
```
Similarly, to run multiple detections, you might do: 
```python
from chart_patterns.chart_patterns.doubles import find_doubles_pattern
df['double_top'], df['double_bottom'] = find_doubles_pattern(df['high'], df['low'])
``` 
or use PyHarmonics:
```python
from pyharmonics.search import HarmonicSearch
hs = HarmonicSearch(df)
hs.search()
harmonics = hs.get_patterns()  # dict of pattern data
```
All of these approaches expect standard DataFrame formats (open/high/low/close/volume columns) and can be applied “real-time” by appending new candles to `df` and re-running detectors. 

## Signal Generation and Best Practices

Once patterns are labeled in the data, you can translate them into trade signals. For each detected pattern, determine the entry/exit logic (e.g. break of the neckline, Fibonacci completion, etc.) and whether it implies a BUY or SELL.  For instance:
- **Head & Shoulders:** standard H&S → signal to **sell** (short) when price breaks the neckline; Inverse H&S → **buy** when neckline breaks upward ([GitHub - keithorange/PatternPy:  PatternPy: A Python package revolutionizing trading analysis with high-speed pattern recognition, leveraging Pandas & Numpy. Effortlessly spot Head & Shoulders, Tops & Bottoms, Supports & Resistances. For experts & beginners. #TradingMadeEasy ](https://github.com/keithorange/PatternPy#:~:text=,df)).  
- **Double Top/Bottom:** double-top reversal → **sell** on second-peak breakout; double-bottom → **buy** on breakout ([GitHub - zeta-zetra/chart_patterns: Automate the detection of chart patterns](https://github.com/zeta-zetra/chart_patterns#:~:text=Here%20is%20a%20list%20of,available%20chart%20patterns)).  
- **Triangles/Flags/Pennants:** continuation or reversal depends on trend context; typically trade the breakout direction.  
- **Harmonics:** bullish patterns (e.g. Bullish Gartley, Bullish Bat) → **buy** at D completion; bearish patterns → **sell**.

It’s advisable to **combine signals** from multiple pattern detectors for robust trading rules. For example, you might only take a trade if both a head-&-shoulders AND a preceding RSI divergence occur, or if multiple timeframes agree.  In code, you could combine DataFrame columns into a single `signal` column. For example:
```python
df['signal'] = 0
df.loc[df['head_shoulder_pattern']=='Head and Shoulder', 'signal'] = -1
df.loc[df['head_shoulder_pattern']=='Inverse Head and Shoulder', 'signal'] = 1
df.loc[df['double_top']==1, 'signal'] = -1
df.loc[df['double_bottom']==1, 'signal'] = 1
# ... etc. ...
```
This creates a consolidated BUY (1) / SELL (-1) signal series.

**Best practices** include: 
- **Vectorized processing:** Use libraries that work on full DataFrames (Pandas/Numpy) so you can scan large histories efficiently.  
- **Noise filtering:** Many pattern scanners (like TradingPatternScanner) allow smoothing (e.g. Savitzky-Golay, Kalman, wavelet denoising ([GitHub - white07S/TradingPatternScanner: Trading Pattern Scanner Identifies complex patterns like head and shoulder, wedge and many more.](https://github.com/white07S/TradingPatternScanner#:~:text=Four%20new%20features%20for%20pattern,detection%20have%20been%20added))) to reduce false detections. Pre-filtering with a small moving average or zigzag pivot helps accuracy.  
- **Confirm breakouts:** A detected pattern is often “triggered” only after price confirms a breakout (e.g. closing beyond a trendline or Fibonacci level). Incorporate price confirmation before signaling a trade.  
- **Backtesting:** Rigorously backtest each pattern signal on historical 5-min BTC/USDT data to calibrate rules (entry, stop loss, targets). Most libraries (like stock-pattern) include backtest utilities.  
- **Resource management:** Running many pattern scans can be CPU-intensive. Only scan new candles (incremental approach) or downsample if needed. Vectorized scans (PatternPy, TradingPatternScanner) tend to be fast and can be run every few seconds on live data.  
- **Integration:** These pattern scanners can feed signals into any trading system (Backtrader, Zipline, vectorbt, etc.) by outputting Pandas Series or arrays. For example, vectorbt (PRO) even includes its own pattern detection module ([How to use VectorBT PRO to algorithmically find chart patterns - PyQuant News](https://www.pyquantnews.com/the-pyquant-newsletter/vectorbt-pro-algorithmically-find-chart-patterns#:~:text=In%20today%E2%80%99s%20guest%20post%2C%20you%E2%80%99ll,unique%20pattern%20and%20window%20combinations)), though the open-source approach is to compute patterns with above libraries and feed the signals into your backtester.

## Example Code Snippet

Below is a consolidated example combining CCXT data fetching with a simple PatternPy detection:

```python
import ccxt
import pandas as pd
from patternpy.tradingpatterns import head_and_shoulders, double_top_bottom

# Fetch 5-min BTC/USDT data via CCXT
exchange = ccxt.binance()
bars = exchange.fetch_ohlcv('BTC/USDT', timeframe='5m', limit=500)
df = pd.DataFrame(bars, columns=['timestamp','open','high','low','close','volume'])
df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
df = df.set_index('timestamp')

# Detect head-&-shoulder patterns
df = head_and_shoulders(df)
print(df[['head_shoulder_pattern']].dropna().tail())

# Detect double tops/bottoms (if available in PatternPy or similar)
df = double_top_bottom(df)
print(df[['double_top_pattern']].dropna().tail())
```

This code would print any recent head-&-shoulder or double-top signals labeled by PatternPy.  From these pattern labels one can craft BUY/SELL signals as shown above.

## Summary and References

In summary, several open-source Python libraries can detect classic chart patterns and harmonic patterns on 5-min BTC/USDT data.  **PatternPy**, **chart_patterns**, **TradingPatternScanner**, and **stock-pattern** cover most classical patterns (Head & Shoulders, Triangles, Flags, etc.) ([GitHub - keithorange/PatternPy:  PatternPy: A Python package revolutionizing trading analysis with high-speed pattern recognition, leveraging Pandas & Numpy. Effortlessly spot Head & Shoulders, Tops & Bottoms, Supports & Resistances. For experts & beginners. #TradingMadeEasy ](https://github.com/keithorange/PatternPy#:~:text=PatternPy%20is%20a%20powerful%20Python,many%20more%20from%20OHLCV%20data)) ([GitHub - zeta-zetra/chart_patterns: Automate the detection of chart patterns](https://github.com/zeta-zetra/chart_patterns#:~:text=ChartPatterns%20,of%20chart%20patterns%20with%20Python)) ([tradingpattern · PyPI](https://pypi.org/project/tradingpattern/#:~:text=Trading%20Pattern%20Scanner%20Identifies%20complex,shoulder%2C%20wedge%20and%20many%20more)) ([GitHub - BennyThadikaran/stock-pattern: A Python CLI tool to scan, detect, and plot stock chart patterns](https://github.com/BennyThadikaran/stock-pattern#:~:text=Stock)).  **PyHarmonics** and **HarmonicPatterns** specialize in harmonic pattern detection ([Pyharmonics documentation — Pyharmonics 1.4.4 documentation](https://pyharmonics.readthedocs.io/#:~:text=Pyharmonics%20detects%20harmonic%20patterns%20in,follow%20author%20Scott%20Carney%20yourself)) ([GitHub - djoffrey/HarmonicPatterns: A library written in Python to search harmonic patterns automatically.](https://github.com/djoffrey/HarmonicPatterns#:~:text=In%20short%2C%20this%20project%20filters,in%20Harmonic%20Patterns)).  These tools work with Pandas DataFrames (which you can populate via CCXT) and can label patterns with bullish/bearish variants for separate BUY/SELL signals. By combining multiple detectors and verifying breakout conditions, one can integrate these pattern recognitions into a systematic trading strategy. 

**Sources:** Library documentation and GitHub repos for PatternPy ([GitHub - keithorange/PatternPy:  PatternPy: A Python package revolutionizing trading analysis with high-speed pattern recognition, leveraging Pandas & Numpy. Effortlessly spot Head & Shoulders, Tops & Bottoms, Supports & Resistances. For experts & beginners. #TradingMadeEasy ](https://github.com/keithorange/PatternPy#:~:text=PatternPy%20is%20a%20powerful%20Python,many%20more%20from%20OHLCV%20data)) ([GitHub - keithorange/PatternPy:  PatternPy: A Python package revolutionizing trading analysis with high-speed pattern recognition, leveraging Pandas & Numpy. Effortlessly spot Head & Shoulders, Tops & Bottoms, Supports & Resistances. For experts & beginners. #TradingMadeEasy ](https://github.com/keithorange/PatternPy#:~:text=Once%20installed%20and%20imported%2C%20you,use%20PatternPy%20as%20follows)), chart_patterns ([GitHub - zeta-zetra/chart_patterns: Automate the detection of chart patterns](https://github.com/zeta-zetra/chart_patterns#:~:text=ChartPatterns%20,of%20chart%20patterns%20with%20Python)), TradingPatternScanner ([tradingpattern · PyPI](https://pypi.org/project/tradingpattern/#:~:text=Trading%20Pattern%20Scanner%20Identifies%20complex,shoulder%2C%20wedge%20and%20many%20more)), stock-pattern ([GitHub - BennyThadikaran/stock-pattern: A Python CLI tool to scan, detect, and plot stock chart patterns](https://github.com/BennyThadikaran/stock-pattern#:~:text=Stock)); PyHarmonics docs ([Pyharmonics documentation — Pyharmonics 1.4.4 documentation](https://pyharmonics.readthedocs.io/#:~:text=Pyharmonics%20detects%20harmonic%20patterns%20in,follow%20author%20Scott%20Carney%20yourself)) ([Pyharmonics documentation — Pyharmonics 1.4.4 documentation](https://pyharmonics.readthedocs.io/#:~:text=1,m.search)); HarmonicPatterns repo ([GitHub - djoffrey/HarmonicPatterns: A library written in Python to search harmonic patterns automatically.](https://github.com/djoffrey/HarmonicPatterns#:~:text=In%20short%2C%20this%20project%20filters,in%20Harmonic%20Patterns)); TA-Lib pattern docs ([TA-Lib](https://ta-lib.github.io/ta-lib-python/func_groups/pattern_recognition.html#:~:text=Pattern%20Recognition%20Functions)).