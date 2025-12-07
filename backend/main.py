from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from heston_model import (
    HestonParams,
    run_heston_simulation,
    calculate_quantum_metrics,
    QuantumMetrics,
    SimulationResult,
    QuantumHardware
)
import numpy as np
app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# --- AI Analyst (Local Transformers) ---

class MarketAnalyst:
    _instance = None
    _model = None
    _tokenizer = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MarketAnalyst, cls).__new__(cls)
        return cls._instance
    
    def load_model(self):
        if self._model is None:
            print("Loading AI Model (Phi-3-mini)... This may take a while...")
            try:
                from transformers import AutoTokenizer, AutoModelForCausalLM
                import torch
                
                model_id = "microsoft/Phi-3-mini-4k-instruct"
                self._tokenizer = AutoTokenizer.from_pretrained(model_id)
                self._model = AutoModelForCausalLM.from_pretrained(
                    model_id, 
                    device_map="auto", 
                    torch_dtype=torch.float16, 
                    trust_remote_code=True,
                    attn_implementation="eager"
                )
                print("✅ AI Model Loaded Successfully!")
            except Exception as e:
                print(f"❌ Failed to load model: {e}")
                self._model = "ERROR"

    def generate_insight(self, params: HestonParams, result: SimulationResult, quantum: QuantumMetrics, ticker: str) -> str:
        # 1. Prepare Data Context
        moneyness = params.S0 / params.K
        if params.optionType == 'Call':
            status = "ITM" if moneyness > 1 else "OTM"
            pct = abs(moneyness - 1) * 100
        else:
            status = "ITM" if moneyness < 1 else "OTM"
            pct = abs(1 - moneyness) * 100
            
        # Rule-Based Fallback
        if abs(result.greeks['delta']) > 0.7: exposure = "high directional exposure"
        elif abs(result.greeks['delta']) < 0.3: exposure = "low directional exposure"
        else: exposure = "moderate exposure"
        
        pq_num = quantum.physicalQubits
        if pq_num > 1_000_000: pq_str = f"{pq_num/1_000_000:.1f}M"
        elif pq_num > 1_000: pq_str = f"{pq_num/1_000:.0f}k"
        else: pq_str = str(pq_num)
        
        fallback_insight = (
            f"{ticker} {params.optionType} (${params.S0:.0f}) {status} ({pct:.1f}%) with {exposure} (Δ {result.greeks['delta']:.2f}). "
            f"Quantum simulation indicates a {quantum.theoreticalSpeedup:.1f}x speedup requiring {pq_str} physical qubits."
        )
        
        # 2. Try AI Generation
        if self._model is None:
            self.load_model()
            
        if self._model == "ERROR":
            return f"{fallback_insight} (AI Failed to Load)"
            
        try:
            # Phi-3 Prompt Template
            messages = [
                {"role": "system", "content": "You are a senior quantitative trader. Provide a sharp, concise analysis under 60 words. Focus on risk (Greeks), moneyness, and the strategic advantage of the quantum speedup. No markdown."},
                {"role": "user", "content": f"""Analyze this option contract:
Ticker: {ticker}
Type: {params.optionType}
Price: ${params.S0:.2f}
Status: {pct:.1f}% {status}
Greeks: Delta {result.greeks['delta']:.2f}, Gamma {result.greeks['gamma']:.4f}, Vega {result.greeks['vega']:.2f}, Theta {result.greeks['theta']:.2f}
Quantum: {quantum.theoreticalSpeedup:.1f}x speedup, {quantum.physicalQubits} qubits

Output requirements:
1. Assess trade setup (bullish/bearish/neutral).
2. Highlight key risks.
3. Explain quantum advantage.
Keep it brief."""}
            ]
            
            input_ids = self._tokenizer.apply_chat_template(
                messages, 
                add_generation_prompt=True, 
                return_tensors="pt"
            ).to(self._model.device)
            
            terminators = [
                self._tokenizer.eos_token_id,
                self._tokenizer.convert_tokens_to_ids("<|endoftext|>")
            ]
            
            outputs = self._model.generate(
                input_ids, 
                max_new_tokens=160, # Increased to prevent cutoff
                eos_token_id=terminators,
                temperature=0.7,
                do_sample=True,
                use_cache=False # Fix for DynamicCache error
            )
            
            generated_text = self._tokenizer.decode(outputs[0][input_ids.shape[-1]:], skip_special_tokens=True)
            return generated_text.strip()
            
        except Exception as e:
            print(f"Generation Error: {e}")
            return f"{fallback_insight} (Error: {str(e)})"

# Global Instance
analyst = MarketAnalyst()

@app.post("/market-insight")
async def get_market_insight(request: InsightRequest):
    try:
        insight = analyst.generate_insight(
            request.params, 
            request.result, 
            request.quantum, 
            request.ticker
        )
        return {"insight": insight}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
