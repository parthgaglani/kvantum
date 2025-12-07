
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area, Legend
} from 'recharts';
import {
  Activity, TrendingUp, Cpu, Play,
  BarChart2, Zap, BrainCircuit, Globe, Radio, RefreshCw, Settings2, Loader2, Link as LinkIcon,
  Wifi, WifiOff, AlertCircle, Clock, Moon, Sun, History, Coffee, Sunset,
  Layers, Box, GitCommit, Pause, Sigma
} from 'lucide-react';
import { Card, Input, Label, Button, Metric, SectionHeader, Slider, Switch, Select } from './components/ui';
import { HestonParams, SimulationResult, QuantumMetrics } from './types';
import { apiService } from './services/api';

// Dynamic Chart Colors based on Theme
const getChartColors = (theme: 'dark' | 'light') => ({
  colors: ['#e5e5e5', '#a3a3a3', '#737373', '#525252', '#404040'],
  grid: theme === 'dark' ? '#262626' : '#e5e5e5',
  text: theme === 'dark' ? '#525252' : '#737373',
  tooltipBg: theme === 'dark' ? '#171717' : '#ffffff',
  tooltipBorder: theme === 'dark' ? '#262626' : '#e5e5e5',
  tooltipText: theme === 'dark' ? '#fff' : '#171717'
});

// Comprehensive list of high-volume optionable assets
const US_STOCKS = [
  // Indices & ETFs
  { label: "Dow Jones Ind (DJI)", value: "DJI", price: 42300.00, vol: 0.12, kappa: 3.5, theta: 0.12 },
  { label: "iShares 20+ Yr Treasury (TLT)", value: "TLT", price: 95.00, vol: 0.14, kappa: 2.0, theta: 0.14 },
  { label: "iShares Russell 2000 (IWM)", value: "IWM", price: 220.00, vol: 0.22, kappa: 2.5, theta: 0.22 },
  { label: "Nasdaq 100 Index (NDX)", value: "NDX", price: 20400.00, vol: 0.18, kappa: 2.5, theta: 0.18 },
  { label: "Nasdaq 100 ETF (QQQ)", value: "QQQ", price: 495.00, vol: 0.18, kappa: 2.5, theta: 0.18 },
  { label: "S&P 500 ETF (SPY)", value: "SPY", price: 585.00, vol: 0.12, kappa: 3.0, theta: 0.12 },
  { label: "S&P 500 Index (SPX)", value: "SPX", price: 5850.00, vol: 0.12, kappa: 3.0, theta: 0.12 },
  { label: "Semiconductor ETF (SMH)", value: "SMH", price: 250.00, vol: 0.35, kappa: 1.8, theta: 0.35 },
  { label: "Volatility Index (VIX)", value: "VIX", price: 15.00, vol: 0.85, kappa: 8.0, theta: 0.85 },

  // Technology (Mag 7 + Semi)
  { label: "Advanced Micro Devices (AMD)", value: "AMD", price: 160.00, vol: 0.40, kappa: 1.2, theta: 0.40 },
  { label: "Amazon.com (AMZN)", value: "AMZN", price: 195.00, vol: 0.28, kappa: 1.4, theta: 0.28 },
  { label: "Apple Inc. (AAPL)", value: "AAPL", price: 235.00, vol: 0.22, kappa: 1.8, theta: 0.22 },
  { label: "Alphabet Inc. (GOOGL)", value: "GOOGL", price: 175.00, vol: 0.25, kappa: 1.5, theta: 0.25 },
  { label: "Broadcom (AVGO)", value: "AVGO", price: 175.00, vol: 0.32, kappa: 1.5, theta: 0.32 },
  { label: "Intel Corp (INTC)", value: "INTC", price: 22.00, vol: 0.40, kappa: 1.0, theta: 0.40 },
  { label: "Meta Platforms (META)", value: "META", price: 580.00, vol: 0.35, kappa: 1.3, theta: 0.35 },
  { label: "Micron Tech (MU)", value: "MU", price: 110.00, vol: 0.45, kappa: 1.2, theta: 0.45 },
  { label: "Microsoft Corp (MSFT)", value: "MSFT", price: 425.00, vol: 0.20, kappa: 2.0, theta: 0.20 },
  { label: "Netflix (NFLX)", value: "NFLX", price: 750.00, vol: 0.32, kappa: 1.6, theta: 0.32 },
  { label: "NVIDIA Corp (NVDA)", value: "NVDA", price: 142.50, vol: 0.45, kappa: 1.2, theta: 0.45 },
  { label: "Palantir Tech (PLTR)", value: "PLTR", price: 42.00, vol: 0.55, kappa: 1.0, theta: 0.55 },
  { label: "Qualcomm (QCOM)", value: "QCOM", price: 170.00, vol: 0.30, kappa: 1.5, theta: 0.30 },
  { label: "Tesla Inc (TSLA)", value: "TSLA", price: 420.00, vol: 0.55, kappa: 1.0, theta: 0.55 },
  { label: "TSMC (TSM)", value: "TSM", price: 190.00, vol: 0.28, kappa: 1.5, theta: 0.28 },

  // Financials & Blue Chips
  { label: "Bank of America (BAC)", value: "BAC", price: 42.00, vol: 0.22, kappa: 2.2, theta: 0.22 },
  { label: "Berkshire Hathaway (BRK-B)", value: "BRK-B", price: 460.00, vol: 0.15, kappa: 2.8, theta: 0.15 },
  { label: "Boeing (BA)", value: "BA", price: 155.00, vol: 0.35, kappa: 1.2, theta: 0.35 },
  { label: "Coca-Cola (KO)", value: "KO", price: 70.00, vol: 0.14, kappa: 3.0, theta: 0.14 },
  { label: "Costco (COST)", value: "COST", price: 900.00, vol: 0.20, kappa: 2.0, theta: 0.20 },
  { label: "Disney (DIS)", value: "DIS", price: 95.00, vol: 0.25, kappa: 1.8, theta: 0.25 },
  { label: "Exxon Mobil (XOM)", value: "XOM", price: 120.00, vol: 0.20, kappa: 2.0, theta: 0.20 },
  { label: "Goldman Sachs (GS)", value: "GS", price: 520.00, vol: 0.22, kappa: 2.0, theta: 0.22 },
  { label: "JPMorgan Chase (JPM)", value: "JPM", price: 225.00, vol: 0.18, kappa: 2.5, theta: 0.18 },
  { label: "Johnson & Johnson (JNJ)", value: "JNJ", price: 165.00, vol: 0.14, kappa: 3.0, theta: 0.14 },
  { label: "Eli Lilly (LLY)", value: "LLY", price: 900.00, vol: 0.28, kappa: 1.5, theta: 0.28 },
  { label: "Visa Inc. (V)", value: "V", price: 290.00, vol: 0.18, kappa: 2.5, theta: 0.18 },
  { label: "Walmart (WMT)", value: "WMT", price: 80.00, vol: 0.16, kappa: 2.8, theta: 0.16 },

  // High Volatility / Crypto / Meme
  { label: "Coinbase (COIN)", value: "COIN", price: 210.00, vol: 0.65, kappa: 0.8, theta: 0.65 },
  { label: "GameStop (GME)", value: "GME", price: 25.00, vol: 0.80, kappa: 0.5, theta: 0.80 },
  { label: "MicroStrategy (MSTR)", value: "MSTR", price: 230.00, vol: 0.75, kappa: 0.8, theta: 0.75 },
  { label: "Robinhood (HOOD)", value: "HOOD", price: 24.00, vol: 0.45, kappa: 1.2, theta: 0.45 },
].sort((a, b) => a.label.localeCompare(b.label));

const GREEKS_TOOLTIPS = {
  delta: "Rate of change of option price with respect to the underlying asset price. Represents the hedge ratio.",
  gamma: "Rate of change of Delta with respect to the underlying asset price. Measures the convexity/curvature of the value.",
  vega: "Sensitivity of the option price to changes in the volatility of the underlying asset."
};

const App: React.FC = () => {
  // --- Theme State ---
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Toggle Theme Class on Body
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const chartTheme = getChartColors(theme);

  // --- App State ---
  const [selectedTicker, setSelectedTicker] = useState("SPX");

  const [params, setParams] = useState<HestonParams>({
    S0: 5850, K: 5900, r: 0.045, T: 0.5,
    v0: 0.04, theta: 0.04, kappa: 3.0, xi: 0.3, rho: -0.7,
    numPaths: 1000, timeSteps: 50,
    optionType: 'Call' // Default
  });

  const [anchorPrice, setAnchorPrice] = useState<number>(5850);
  const [isLive, setIsLive] = useState(false);
  const [autoCalc, setAutoCalc] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [priceSource, setPriceSource] = useState<string | null>(null);
  const [dataTimestamp, setDataTimestamp] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'active' | 'connecting' | 'offline'>('offline');
  const [marketStatus, setMarketStatus] = useState<'OPEN' | 'CLOSED' | 'PRE-MARKET' | 'AFTER-HOURS'>('CLOSED');
  const [marketChange, setMarketChange] = useState<{ value: number, percent: number } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('-');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [quantumMetrics, setQuantumMetrics] = useState<QuantumMetrics | null>(null);
  const [greeksData, setGreeksData] = useState<any[]>([]);
  const [marketHistory, setMarketHistory] = useState<{ time: string, price: number }[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const paramsRef = useRef(params);
  useEffect(() => { paramsRef.current = params; }, [params]);

  const handleStockChange = async (value: string) => {
    const stock = US_STOCKS.find(s => s.value === value);
    if (stock) {
      setSelectedTicker(value);
      setIsFetchingPrice(true);
      setConnectionStatus('connecting');
      setPriceSource(null);
      setDataTimestamp(null);

      setParams(prev => ({
        ...prev,
        v0: stock.vol * stock.vol,
        theta: stock.theta * stock.theta,
        kappa: stock.kappa,
        S0: stock.price,
        K: Math.round(stock.price * 1.02)
      }));
      setAnchorPrice(stock.price);

      try {
        const realData = await apiService.getMarketData(stock.value);
        let newPrice = stock.price;
        if (realData && realData.price > 0) {
          newPrice = realData.price;
          setPriceSource(realData.source || 'yfinance');
          setDataTimestamp(realData.time || 'Delayed');
          setAnchorPrice(newPrice);
          setConnectionStatus('active');
          setLastUpdate(new Date().toLocaleTimeString());
          if (realData.status) setMarketStatus(realData.status as any);
          if (realData.change !== undefined && realData.changePercent !== undefined) {
            setMarketChange({ value: realData.change, percent: realData.changePercent });
          } else {
            setMarketChange(null);
          }
        } else {
          setPriceSource('Estimating (Data Unavailable)');
          setConnectionStatus('offline');
          setLastUpdate(new Date().toLocaleTimeString());
        }

        setParams(prev => ({
          ...prev,
          S0: newPrice,
          K: Math.round(newPrice * 1.02),
        }));
      } catch (e) {
        console.error("Failed to update stock", e);
        setConnectionStatus('offline');
      } finally {
        setMarketHistory([]);
        setIsFetchingPrice(false);
      }
    }
  };

  const runSimulation = async (currentParams: HestonParams) => {
    try {
      const res = await apiService.runSimulation(currentParams);
      const qMetrics = await apiService.getQuantumMetrics(currentParams);
      setResult(res);
      setQuantumMetrics(qMetrics);
      return res;
    } catch (error) {
      console.error("Simulation failed:", error);
      // Optional: Add error state handling here
      return null;
    }
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setAiInsight("");
    // Use setTimeout to allow UI to update loading state before async work
    setTimeout(async () => {
      await runSimulation(params);
      setIsSimulating(false);
    }, 50);
  };

  const handleGetInsight = async () => {
    if (!result || !quantumMetrics) return;
    setIsAiLoading(true);
    const text = await apiService.getMarketInsight(params, result, quantumMetrics, selectedTicker);
    setAiInsight(text);
    setIsAiLoading(false);
  };

  const handleRefreshData = () => {
    handleStockChange(selectedTicker);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const isMarketActive = marketStatus === 'OPEN' || marketStatus === 'PRE-MARKET' || marketStatus === 'AFTER-HOURS';

    if (isLive) {
      if (connectionStatus === 'offline' && priceSource) setConnectionStatus('active');
      if (marketHistory.length === 0) setMarketHistory(Array(20).fill({ time: '', price: anchorPrice }));

      interval = setInterval(() => {
        setParams(prev => {
          if (!isMarketActive) return prev;
          const volatility = 0.00005;
          const meanReversion = 0.8;
          const currentDeviation = prev.S0 - anchorPrice;
          const pullBack = -currentDeviation * meanReversion;
          const randomShock = (Math.random() - 0.5) * 2 * (anchorPrice * volatility);
          const newSpot = prev.S0 + pullBack + randomShock;

          setMarketHistory(h => {
            const newH = [...h, { time: new Date().toLocaleTimeString(), price: newSpot }];
            return newH.slice(-30);
          });
          return { ...prev, S0: newSpot };
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLive, autoCalc, anchorPrice, marketHistory.length, connectionStatus, isFetchingPrice, priceSource, marketStatus]);

  useEffect(() => {
    if (isLive && autoCalc) {
      runSimulation(params);
    }
  }, [params.S0, params.r, params.optionType, isLive, autoCalc]);

  useEffect(() => {
    handleRunSimulation();
    handleStockChange("SPX");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const distributionData = useMemo(() => {
    if (!result) return [];
    const prices = result.finalPrices;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const bins = 25;
    const binSize = (max - min) / bins;
    const histogram = new Array(bins).fill(0);

    prices.forEach(p => {
      const binIndex = Math.min(Math.floor((p - min) / binSize), bins - 1);
      histogram[binIndex]++;
    });

    return histogram.map((count, i) => {
      const val = min + i * binSize;
      const range = val.toFixed(1);
      // Determine ITM vs OTM color based on option type
      let isITM = false;
      if (params.optionType === 'Call') {
        isITM = val > params.K;
      } else {
        isITM = val < params.K;
      }
      return {
        range,
        count,
        color: isITM ? '#34d399' : (theme === 'dark' ? '#404040' : '#a3a3a3')
      };
    });
  }, [result, params.K, params.optionType, theme]);

  // Note: Greeks curve data generation is now more complex as it requires multiple API calls.
  // For now, we will disable the real-time curve generation or we need to add a bulk endpoint.
  // To keep it simple and performant, we'll temporarily mock it or fetch it if needed.
  // For this migration, I will comment it out to prevent excessive API calls during render.
  // Fetch Greeks Term Structure
  useEffect(() => {
    const fetchGreeks = async () => {
      const data = await apiService.getGreeksTermStructure(params);
      setGreeksData(data);
    };
    // Debounce slightly to avoid too many calls while dragging sliders
    const timeout = setTimeout(fetchGreeks, 300);
    return () => clearTimeout(timeout);
  }, [params]);

  const greeksCurveData = greeksData;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-200 pb-20 font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800 selection:text-black dark:selection:text-white transition-colors duration-500">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/5 transition-colors duration-500">
        <div className="max-w-[1800px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="w-8 h-8 rounded-full border border-neutral-300 dark:border-white/20 flex items-center justify-center bg-neutral-100 dark:bg-white/5 backdrop-blur group-hover:bg-neutral-200 dark:group-hover:bg-white/10 transition-colors">
              <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
            </div>
            <h1 className="text-lg font-sans font-medium tracking-[0.3em] text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">KVANTUM</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="group relative">
              <button className={`hidden md:flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300 ${connectionStatus === 'connecting'
                ? 'bg-amber-100/50 dark:bg-amber-950/30 border-amber-500/30 text-amber-600 dark:text-amber-400'
                : marketStatus === 'OPEN'
                  ? 'bg-emerald-100/50 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : marketStatus === 'CLOSED'
                    ? 'bg-rose-100/50 dark:bg-red-950/40 border-rose-800/20 dark:border-red-800/50 text-rose-600 dark:text-red-400 hover:bg-rose-200/50 dark:hover:bg-red-900/40'
                    : 'bg-indigo-100/50 dark:bg-indigo-950/30 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                }`}>
                <div className="relative flex items-center justify-center">
                  {marketStatus === 'OPEN' ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <div className="absolute inset-0 w-full h-full bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                    </>
                  ) : marketStatus === 'CLOSED' ? (
                    <Moon className="w-3 h-3 text-rose-500 dark:text-red-400" />
                  ) : (
                    <Clock className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                  )}
                </div>
                <span className="text-xs font-bold tracking-wider uppercase">
                  {connectionStatus === 'connecting' ? 'CONNECTING...' :
                    marketStatus === 'OPEN' ? 'MARKET OPEN' :
                      marketStatus === 'CLOSED' ? 'MARKET CLOSED' :
                        marketStatus.replace('-', ' ')}
                </span>
              </button>
              <div className="absolute top-full right-0 mt-4 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform translate-y-2 group-hover:translate-y-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-neutral-100 dark:border-white/5">
                    <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Status</span>
                    <div className="flex items-center gap-1.5">
                      {marketStatus === 'OPEN' ? <Sun className="w-3 h-3 text-emerald-500" /> :
                        marketStatus === 'CLOSED' ? <Moon className="w-3 h-3 text-rose-500" /> :
                          <Sunset className="w-3 h-3 text-indigo-500" />}
                      <span className={`text-xs ${marketStatus === 'OPEN' ? 'text-emerald-600 dark:text-emerald-400' :
                        marketStatus === 'CLOSED' ? 'text-rose-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'
                        }`}>
                        {marketStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Source</span>
                    <span className="text-xs text-neutral-600 dark:text-neutral-300 truncate max-w-[120px] font-mono">{priceSource || 'Local Sim'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">
                      {marketStatus === 'CLOSED' ? 'Last Close' : 'Data Time'}
                    </span>
                    <span className="text-xs text-neutral-600 dark:text-neutral-300 font-mono text-right">{dataTimestamp || lastUpdate}</span>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-neutral-400 hover:text-white" /> : <Moon className="w-5 h-5 text-neutral-600 hover:text-black" />}
            </button>

            <a href="#" className="text-neutral-400 hover:text-black dark:text-neutral-500 dark:hover:text-white transition-colors">
              <Settings2 className="w-5 h-5" />
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-[1800px] mx-auto px-6 pt-28 grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* SIDEBAR */}
        <div className="xl:col-span-3 space-y-6">
          <div className="sticky top-28 space-y-6">
            <Card className="border-none bg-neutral-50/50 dark:bg-neutral-900/40 p-0 overflow-hidden" noPadding>
              <div className="p-6 border-b border-neutral-200 dark:border-white/5 bg-neutral-100/50 dark:bg-neutral-900/60">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white tracking-wide">CONFIGURATION</span>
                  {isSimulating && <RefreshCw className="w-4 h-4 animate-spin text-neutral-500" />}
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Radio className={`w-4 h-4 ${isLive ? 'text-emerald-500' : 'text-neutral-400 dark:text-neutral-600'}`} />
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Live Market Feed</span>
                    </div>
                    <Switch checked={isLive} onChange={setIsLive} />
                  </div>
                  {isLive && (
                    <div className="flex items-center justify-between pl-7 animate-in fade-in slide-in-from-top-2 duration-300">
                      <span className="text-xs text-neutral-500">Auto-Calculate</span>
                      <Switch checked={autoCalc} onChange={setAutoCalc} />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-10 max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar">

                {/* Market Section */}
                <div className="space-y-8">
                  <SectionHeader title="Market" icon={Globe} />
                  <div className="space-y-6">

                    {/* Ticker Selector */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-1">
                        <Label className="text-neutral-500 mb-0">Asset Selection</Label>
                        <button onClick={handleRefreshData} className="text-xs text-neutral-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1 group">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px]">REFRESH</span>
                          <RefreshCw className={`w-3 h-3 ${isFetchingPrice ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                      <Select
                        value={selectedTicker}
                        onChange={handleStockChange}
                        options={US_STOCKS}
                        disabled={isLive || isFetchingPrice}
                      />
                    </div>

                    {/* NEW: Option Type Toggle */}
                    <div className="space-y-2">
                      <Label className="text-neutral-500 mb-0">Option Type</Label>
                      <div className="grid grid-cols-2 bg-neutral-200 dark:bg-neutral-800/50 p-1 rounded-lg">
                        <button
                          onClick={() => setParams({ ...params, optionType: 'Call' })}
                          className={`py-1.5 text-xs font-bold uppercase rounded-md transition-all ${params.optionType === 'Call' ? 'bg-emerald-600 text-white shadow-lg' : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-neutral-200'}`}
                        >
                          Call
                        </button>
                        <button
                          onClick={() => setParams({ ...params, optionType: 'Put' })}
                          className={`py-1.5 text-xs font-bold uppercase rounded-md transition-all ${params.optionType === 'Put' ? 'bg-rose-600 text-white shadow-lg' : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-neutral-200'}`}
                        >
                          Put
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <Label className="text-neutral-500 mb-0">Spot Price <span className="text-emerald-600 dark:text-emerald-500/80 font-serif italic ml-1">S₀</span></Label>
                        {isLive && marketStatus === 'OPEN' && <span className="text-[9px] text-emerald-600 dark:text-emerald-500 font-mono animate-pulse">LIVE</span>}
                      </div>
                      <Input
                        value={params.S0}
                        onChange={v => {
                          setParams({ ...params, S0: v });
                          if (!isLive) setAnchorPrice(v);
                        }}
                        disabled={isLive || isFetchingPrice}
                        className="text-lg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-neutral-500 mb-0">Strike <span className="text-neutral-600 dark:text-neutral-600 font-serif italic ml-1">K</span></Label>
                        <Input value={params.K} onChange={v => setParams({ ...params, K: v })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-500 mb-0">Rate <span className="text-neutral-600 dark:text-neutral-600 font-serif italic ml-1">r</span></Label>
                        <Input value={params.r} step="0.001" onChange={v => setParams({ ...params, r: v })} disabled={isLive} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-neutral-500 mb-0">Maturity <span className="text-neutral-600 dark:text-neutral-600 font-serif italic ml-1">T</span></Label>
                      <Slider min={0.1} max={5.0} step={0.1} value={params.T} onChange={v => setParams({ ...params, T: v })} />
                    </div>
                  </div>
                </div>

                {/* Dynamics Section */}
                <div className="space-y-8">
                  <SectionHeader title="Dynamics" icon={Activity} />
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-neutral-500 mb-0">Initial Var <span className="text-indigo-600 dark:text-indigo-400 font-serif italic ml-1">v₀</span></Label>
                        <Input value={params.v0} step="0.001" onChange={v => setParams({ ...params, v0: v })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-500 mb-0">Long-Run <span className="text-indigo-600 dark:text-indigo-400 font-serif italic ml-1">θ</span></Label>
                        <Input value={params.theta} step="0.001" onChange={v => setParams({ ...params, theta: v })} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-neutral-500 mb-0">Mean Reversion <span className="text-indigo-600 dark:text-indigo-400 font-serif italic ml-1">κ</span></Label>
                      <Slider min={0.1} max={10.0} step={0.1} value={params.kappa} onChange={v => setParams({ ...params, kappa: v })} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-neutral-500 mb-0">Vol of Vol <span className="text-indigo-600 dark:text-indigo-400 font-serif italic ml-1">ξ</span></Label>
                      <Slider min={0.01} max={2.0} step={0.05} value={params.xi} onChange={v => setParams({ ...params, xi: v })} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-neutral-500 mb-0">Correlation <span className="text-indigo-600 dark:text-indigo-400 font-serif italic ml-1">ρ</span></Label>
                      <Slider min={-0.99} max={0.99} step={0.05} value={params.rho} onChange={v => setParams({ ...params, rho: v })} />
                    </div>
                  </div>
                </div>

                {/* Compute Section */}
                <div className="space-y-8">
                  <SectionHeader title="Compute" icon={Cpu} />
                  <div>
                    <Label className="text-neutral-500 mb-2">Monte Carlo Paths</Label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[1000, 10000, 50000].map(val => (
                        <button
                          key={val}
                          onClick={() => setParams({ ...params, numPaths: val })}
                          className={`
                                   px-2 py-2 rounded-lg text-[10px] font-bold tracking-wider transition-all
                                   ${params.numPaths === val
                              ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg'
                              : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-700'}
                                `}
                        >
                          {(val / 1000)}k
                        </button>
                      ))}
                    </div>
                    <Input value={params.numPaths} type="number" step="100" onChange={v => setParams({ ...params, numPaths: v })} className="text-xs" />
                  </div>
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <Label className="text-neutral-500 mb-0">Time Steps</Label>
                      <span className="text-[9px] text-neutral-500 font-mono">
                        dt ≈ {((params.T / params.timeSteps) * 252).toFixed(1)} days
                      </span>
                    </div>
                    <Slider min={10} max={200} step={10} value={params.timeSteps} onChange={v => setParams({ ...params, timeSteps: v })} />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-neutral-200 dark:border-white/5 bg-neutral-100/50 dark:bg-neutral-900/60">
                {isLive && autoCalc ? (
                  <div className="w-full bg-white dark:bg-neutral-900 border border-emerald-500/30 dark:border-emerald-900/30 rounded-xl px-4 py-3 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Engine Online</span>
                        <span className="text-[9px] text-neutral-500 font-mono">Latency: 45ms</span>
                      </div>
                    </div>
                    <Activity className="w-4 h-4 text-emerald-500/50 animate-pulse" />
                  </div>
                ) : (
                  <Button onClick={handleRunSimulation} isLoading={isSimulating} className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    Run Simulation
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* MAIN DASHBOARD */}
        <div className="xl:col-span-9 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <Card className="md:col-span-8 flex flex-col justify-center">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                <Metric
                  label={`${params.optionType.toUpperCase()} Price`}
                  value={result ? `$ ${result.price.toFixed(2)}` : '-'}
                  trend={result ? 'neutral' : 'neutral'}
                  subtext={result ? `± ${result.standardError.toFixed(2)}` : ''}
                />
                <Metric
                  label="Delta"
                  value={result ? result.greeks.delta.toFixed(3) : '-'}
                  subtext="Sensitivity"
                  tooltip={GREEKS_TOOLTIPS.delta}
                />
                <Metric
                  label="Gamma"
                  value={result ? result.greeks.gamma.toFixed(4) : '-'}
                  subtext="Curvature"
                  tooltip={GREEKS_TOOLTIPS.gamma}
                />
                <Metric
                  label="Vega"
                  value={result ? result.greeks.vega.toFixed(3) : '-'}
                  subtext="Volatility Risk"
                  tooltip={GREEKS_TOOLTIPS.vega}
                />
              </div>
            </Card>

            <Card className="md:col-span-4 relative overflow-hidden h-40 md:h-auto min-h-[160px]" noPadding>
              <div className="relative z-20 p-6 pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                    {US_STOCKS.find(s => s.value === selectedTicker)?.label}
                  </span>
                  {isFetchingPrice && <Loader2 className="w-3 h-3 animate-spin text-neutral-500" />}
                </div>
                <span className="text-3xl font-light text-neutral-900 dark:text-white tracking-tight block">
                  $ {params.S0.toFixed(2)}
                </span>
                <div className="flex flex-col gap-1 mt-1">
                  {isLive && marketStatus === 'OPEN' && (
                    <div className="flex items-center gap-1">
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-50 font-medium">Live Feed</span>
                    </div>
                  )}
                  {marketStatus === 'CLOSED' && (
                    <div className="flex items-center gap-1">
                      <Moon className="w-3 h-3 text-rose-500 dark:text-red-400" />
                      <span className="text-[9px] text-rose-500 dark:text-red-400 font-medium">Market Closed</span>
                    </div>
                  )}
                  {dataTimestamp && (
                    <div className="flex items-center gap-1 opacity-60">
                      <Clock className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                      <span className="text-[9px] text-neutral-600 dark:text-neutral-400 font-mono">{dataTimestamp}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute inset-0 z-0 pt-16">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={marketHistory}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={marketStatus === 'OPEN' ? "#10b981" : "#525252"} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={marketStatus === 'OPEN' ? "#10b981" : "#525252"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={marketStatus === 'OPEN' ? "#10b981" : (theme === 'dark' ? "#525252" : "#a3a3a3")}
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-2xl opacity-10 dark:opacity-20 group-hover:opacity-30 dark:group-hover:opacity-40 transition duration-500 blur"></div>
            <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-white/5 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between overflow-hidden shadow-xl shadow-neutral-200/50 dark:shadow-none">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none transform translate-x-10 -translate-y-10">
                <BrainCircuit className="w-64 h-64 text-black dark:text-white" />
              </div>
              <div className="relative z-10 flex-1 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">Quantum Intelligence</span>
                </div>
                <div className="text-emerald-900 dark:text-emerald-50 text-sm font-mono font-medium leading-relaxed max-w-4xl tracking-wide bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-900/30 shadow-inner">
                  {aiInsight ? (
                    <p className="animate-fade-in">{aiInsight}</p>
                  ) : (
                    <p className="opacity-40 italic">Waiting for analysis command...</p>
                  )}
                </div>
              </div>
              <div className="relative z-10 shrink-0">
                <Button
                  onClick={handleGetInsight}
                  disabled={isAiLoading || !result}
                  variant="outline"
                  className="border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white/20 text-neutral-900 dark:text-white"
                >
                  {isAiLoading ? "Processing..." : "Generate Insight"}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <div className="flex items-center justify-between mb-8 min-w-0">
                <SectionHeader title="Stochastic Paths" icon={TrendingUp} />
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[9px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Heston Log-Euler</span>
                </div>
              </div>
              <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={result?.paths || []} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                    <XAxis
                      dataKey="time"
                      type="number"
                      domain={[0, params.T]}
                      tick={{ fontSize: 10, fill: chartTheme.text }}
                      tickFormatter={(v) => v.toFixed(1)}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 10, fill: chartTheme.text }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderRadius: '8px', border: `1px solid ${chartTheme.tooltipBorder}`, color: chartTheme.tooltipText }}
                      itemStyle={{ fontSize: '12px', color: chartTheme.tooltipText }}
                      labelStyle={{ color: chartTheme.text, fontSize: '11px', marginBottom: '4px' }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                    />
                    {Array.from({ length: 50 }).map((_, i) => (
                      <Line
                        key={i}
                        dataKey="value"
                        data={result?.paths.filter(p => p.pathId === i)}
                        type="monotone"
                        stroke={chartTheme.colors[i % 5]}
                        strokeWidth={1}
                        strokeOpacity={0.15} // Low opacity for cloud effect
                        dot={false}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-8 min-w-0">
                <SectionHeader title="Greeks Term Structure" icon={Sigma} />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide">Delta</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide">Vega</span>
                  </div>
                </div>
              </div>
              <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={greeksCurveData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                    <XAxis
                      dataKey="time"
                      label={{ value: 'Time to Maturity (Years)', position: 'insideBottom', offset: -5, fontSize: 10, fill: chartTheme.text }}
                      tick={{ fontSize: 10, fill: chartTheme.text }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      domain={params.optionType === 'Call' ? [0, 1] : [-1, 0]}
                      tick={{ fontSize: 10, fill: chartTheme.text }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 10, fill: chartTheme.text }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderRadius: '8px', border: `1px solid ${chartTheme.tooltipBorder}`, color: chartTheme.tooltipText }}
                      itemStyle={{ fontSize: '12px', color: chartTheme.tooltipText }}
                      labelFormatter={(t) => `T = ${t} yrs`}
                      labelStyle={{ color: chartTheme.text }}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="delta" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="vega" stroke="#818cf8" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="gamma" stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Gamma (x1000)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-8 min-w-0">
                <SectionHeader title="Price Distribution" icon={BarChart2} />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide">ITM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 dark:bg-neutral-700"></div>
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide">OTM</span>
                  </div>
                </div>
              </div>
              <div className="h-64 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={distributionData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 10, fill: chartTheme.text }}
                      axisLine={false}
                      tickLine={false}
                      interval={3}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: theme === 'dark' ? '#262626' : '#f5f5f5', opacity: 0.4 }}
                      contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderRadius: '8px', border: `1px solid ${chartTheme.tooltipBorder}`, color: chartTheme.tooltipText }}
                      itemStyle={{ color: chartTheme.tooltipText }}
                      labelStyle={{ color: chartTheme.text }}
                      formatter={(value: number) => [value, 'Paths']}
                    />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full"></div>

            <div className="flex items-center justify-between mb-8 relative z-10 border-b border-neutral-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <SectionHeader title="Quantum Acceleration" icon={Cpu} />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">v.IQAE-2.0</span>
                </div>
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse"></span>
                  <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-widest">Qiskit Active</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
              <div className="lg:col-span-4 space-y-8 border-r border-neutral-100 dark:border-white/5 pr-8">
                <div>
                  <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Theoretical Speedup</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-light text-indigo-600 dark:text-indigo-400 tracking-tighter">
                      {quantumMetrics?.theoreticalSpeedup.toFixed(1)}<span className="text-2xl opacity-60">x</span>
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed">
                    Iterative Quantum Amplitude Estimation (IQAE) achieves <span className="text-black dark:text-white font-serif italic">O(ε⁻¹)</span> scaling compared to classical Monte Carlo's <span className="text-black dark:text-white font-serif italic">O(ε⁻²)</span>.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] text-neutral-500 uppercase tracking-widest">
                    <span>Qubit Utilization</span>
                    <span>{quantumMetrics?.estimatedQubits} Total</span>
                  </div>
                  <div className="flex h-2 w-full rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <div className="bg-indigo-600 dark:bg-indigo-500" style={{ width: `${(quantumMetrics?.qubitBreakdown.state || 0) / (quantumMetrics?.estimatedQubits || 1) * 100}%` }} title="State Registers"></div>
                    <div className="bg-indigo-400/50 dark:bg-indigo-400/50" style={{ width: `${(quantumMetrics?.qubitBreakdown.ancilla || 0) / (quantumMetrics?.estimatedQubits || 1) * 100}%` }} title="Ancilla"></div>
                    <div className="bg-neutral-400 dark:bg-neutral-700" style={{ width: `${(quantumMetrics?.qubitBreakdown.qae || 0) / (quantumMetrics?.estimatedQubits || 1) * 100}%` }} title="QAE Overhead"></div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-500"></div>
                      <span className="text-[9px] text-neutral-500 dark:text-neutral-400">State</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/50"></div>
                      <span className="text-[9px] text-neutral-500 dark:text-neutral-400">Ancilla</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 grid grid-cols-2 gap-6">
                <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-200 dark:border-white/5 group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-neutral-400 dark:text-neutral-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Logical Depth</span>
                  </div>
                  <div className="text-2xl font-light text-neutral-900 dark:text-white mb-1">
                    {((quantumMetrics?.circuitDepth || 0) / 1000).toFixed(1)}k
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-600">Operations Layer</div>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-200 dark:border-white/5 group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Box className="w-4 h-4 text-neutral-400 dark:text-neutral-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">T-Gate Count</span>
                  </div>
                  <div className="text-2xl font-light text-neutral-900 dark:text-white mb-1">
                    {((quantumMetrics?.tGateCount || 0) / 1000000).toFixed(2)}M
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-600">Magic States (Est.)</div>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-200 dark:border-white/5 group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <GitCommit className="w-4 h-4 text-neutral-400 dark:text-neutral-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">CNOT Count</span>
                  </div>
                  <div className="text-2xl font-light text-neutral-900 dark:text-white mb-1">
                    {((quantumMetrics?.cnotCount || 0) / 1000000).toFixed(2)}M
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-600">Entanglements</div>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-200 dark:border-white/5 group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-neutral-400 dark:text-neutral-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Est. Error</span>
                  </div>
                  <div className="text-2xl font-light text-neutral-900 dark:text-white mb-1">
                    {quantumMetrics?.estimatedQuantumError ? quantumMetrics.estimatedQuantumError.toExponential(2) : '-'}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-600">Convergence Limit (ε)</div>
                </div>

                <div className="col-span-2 grid grid-cols-3 gap-4 mt-2 pt-4 border-t border-neutral-100 dark:border-white/5">
                  <div>
                    <span className="block text-[9px] text-neutral-500 uppercase tracking-widest mb-1">State Reg</span>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300 font-mono">{quantumMetrics?.qubitBreakdown.state} <span className="text-neutral-400 dark:text-neutral-600">q</span></span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-neutral-500 uppercase tracking-widest mb-1">Ancilla</span>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300 font-mono">{quantumMetrics?.qubitBreakdown.ancilla} <span className="text-neutral-400 dark:text-neutral-600">q</span></span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-neutral-500 uppercase tracking-widest mb-1">QAE Overhead</span>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300 font-mono">{quantumMetrics?.qubitBreakdown.qae} <span className="text-neutral-400 dark:text-neutral-600">q</span></span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default App;
