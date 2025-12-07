from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from heston_model import HestonParams, SimulationResult, QuantumMetrics, run_heston_simulation, calculate_quantum_metrics
from pydantic import BaseModel

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify the frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/simulate", response_model=SimulationResult)
async def simulate(params: HestonParams):
    result = run_heston_simulation(params)
    return result

@app.post("/quantum-metrics", response_model=QuantumMetrics)
async def get_quantum_metrics(params: HestonParams):
    return calculate_quantum_metrics(params)

@app.get("/market-data/{ticker}")
async def get_market_data(ticker: str):
    import yfinance as yf
    try:
        stock = yf.Ticker(ticker)
        # Get fast info
        info = stock.fast_info
        price = info.last_price
        
        # Fallback
        if price is None:
            hist = stock.history(period="1d")
            if not hist.empty:
                price = hist["Close"].iloc[-1]
        
        if price is None:
             return {"error": "Price not found"}

        # Determine status
        # yfinance 'marketState' is often available in stock.info (the full dict, not fast_info)
        # fetching stock.info can be slow, but it's the reliable way to get marketState.
        # Alternatively, fast_info doesn't explicitly have marketState.
        # Let's try to fetch info.
        full_info = stock.info
        market_state = full_info.get('marketState', 'CLOSED')
        
        status_map = {
            'PRE': 'PRE-MARKET',
            'REGULAR': 'OPEN',
            'POST': 'AFTER-HOURS',
            'CLOSED': 'CLOSED',
            'PREPRE': 'PRE-MARKET', 
            'POSTPOST': 'AFTER-HOURS'
        }
        
        status = status_map.get(market_state, 'CLOSED')
        
        # If we are in pre/post, we might want to show that price if available
        # But fast_info.last_price is usually the most recent trade anyway.
        
        return {
            "price": price,
            "source": "yfinance",
            "time": "Delayed/Real-time",
            "status": status,
            "change": full_info.get('regularMarketChange'),
            "changePercent": full_info.get('regularMarketChangePercent')
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/greeks-term-structure")
async def get_greeks_term_structure(params: HestonParams):
    from heston_model import calculate_greeks
    import numpy as np
    
    points = []
    steps = 20
    
    for i in range(steps + 1):
        t = params.T - (i / steps) * (params.T - 0.01)
        if t <= 0: continue
        
        temp_params = params.model_copy(update={"T": t})
        greeks = calculate_greeks(temp_params, params.S0)
        
        points.append({
            "time": float(f"{t:.2f}"),
            "delta": greeks["delta"],
            "gamma": greeks["gamma"] * 1000, 
            "vega": greeks["vega"]
        })
        
    points.sort(key=lambda x: x["time"])
    return points

class InsightRequest(BaseModel):
    params: HestonParams
    result: SimulationResult
    quantum: QuantumMetrics
    ticker: str

@app.post("/market-insight")
async def get_market_insight(req: InsightRequest):
    import google.generativeai as genai
    import os
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"insight": "API KEY MISSING. UNABLE TO GENERATE QUANTUM ANALYTICS."}
        
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    params = req.params
    result = req.result
    quantum = req.quantum
    ticker_symbol = req.ticker
    
    moneyness = params.S0 / params.K
    status_dir = "ITM" if (params.optionType == 'Put' and moneyness < 1) or (params.optionType == 'Call' and moneyness >= 1) else "OTM"
    status_pct = abs(1 - moneyness) * 100
    
    iv = (np.sqrt(params.v0) * 100)
    speedup = quantum.theoreticalSpeedup
    t_gates = f"{quantum.tGateCount / 1000000:.1f}M"
    
    prompt = f"""
    Role: High-Frequency Trading Algorithm Output.
    Task: Generate a SINGLE LINE of ultra-concise Bloomberg-style shorthand data.
    
    Data:
    - Ticker: {ticker_symbol}
    - Type: {params.optionType.upper()} Option
    - Price: {params.S0:.2f}
    - Moneyness: {status_pct:.2f}% {status_dir}
    - Greeks: D {result.greeks['delta']:.2f}, G {result.greeks['gamma']:.4f}, V {result.greeks['vega']:.2f}
    - IV: {iv:.1f}%
    - Quantum: {speedup:.1f}x Speedup, {quantum.estimatedQubits} Logical Qubits
    
    Constraints:
    - STRICTLY ONE LINE.
    - USE "|" AS DELIMITER.
    - NO EXPLANATORY TEXT.
    - ABBREVIATIONS: D (Delta), G (Gamma), V (Vega), IV (Implied Vol), Q-SPD (Speedup).
    
    Format:
    [TICKER] [TYPE] [PRICE] | [Moneyness] | D.[val] G.[val] V.[val] | IV[val]% | Q-SPD [val]x
    """
    
    try:
        response = model.generate_content(prompt)
        return {"insight": response.text.strip()}
    except Exception as e:
        return {"insight": "SERVICE UNAVAILABLE."}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
