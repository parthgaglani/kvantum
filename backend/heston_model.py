import numpy as np
import time
from scipy.stats import norm
from pydantic import BaseModel
from typing import List, Literal, Dict

class HestonParams(BaseModel):
    S0: float
    K: float
    r: float
    T: float
    v0: float
    theta: float
    kappa: float
    xi: float
    rho: float
    numPaths: int
    timeSteps: int
    optionType: Literal['Call', 'Put']

class SimulationResult(BaseModel):
    price: float
    standardError: float
    paths: List[Dict]
    finalPrices: List[float]
    greeks: Dict[str, float]
    executionTime: float

class QuantumMetrics(BaseModel):
    estimatedQubits: int
    circuitDepth: int
    theoreticalSpeedup: float
    estimatedQuantumError: float
    tGateCount: int
    cnotCount: int
    oracleDepth: int
    groverIterations: int
    qubitBreakdown: Dict[str, int]

def calculate_greeks(params: HestonParams, current_price: float) -> Dict[str, float]:
    S0 = params.S0
    K = params.K
    r = params.r
    T = params.T
    theta = params.theta
    option_type = params.optionType
    
    vol = np.sqrt(theta)
    safe_T = max(0.0001, T)
    
    d1 = (np.log(S0 / K) + (r + 0.5 * vol**2) * safe_T) / (vol * np.sqrt(safe_T))
    d2 = d1 - vol * np.sqrt(safe_T)
    
    pdf_d1 = norm.pdf(d1)
    cdf_d1 = norm.cdf(d1)
    cdf_d2 = norm.cdf(d2)
    cdf_minus_d2 = norm.cdf(-d2)
    
    gamma = pdf_d1 / (S0 * vol * np.sqrt(safe_T))
    vega = S0 * np.sqrt(safe_T) * pdf_d1 / 100
    
    if option_type == 'Put':
        delta = cdf_d1 - 1
        theta_val = (- (S0 * vol * pdf_d1) / (2 * np.sqrt(safe_T)) + r * K * np.exp(-r * safe_T) * cdf_minus_d2) / 365
        rho = -K * safe_T * np.exp(-r * safe_T) * cdf_minus_d2 / 100
    else:
        delta = cdf_d1
        theta_val = (- (S0 * vol * pdf_d1) / (2 * np.sqrt(safe_T)) - r * K * np.exp(-r * safe_T) * norm.cdf(d2)) / 365
        rho = K * safe_T * np.exp(-r * safe_T) * norm.cdf(d2) / 100
        
    return {
        "delta": float(delta),
        "gamma": float(gamma),
        "vega": float(vega),
        "theta": float(theta_val),
        "rho": float(rho)
    }

def calculate_quantum_metrics(params: HestonParams) -> QuantumMetrics:
    # 1. Precision Scaling
    target_error = 1 / np.sqrt(params.numPaths)
    precision_bits = int(np.ceil(10 + max(0, -np.log2(target_error))))
    
    # 2. QAE Complexity
    grover_iterations = int(np.ceil((np.pi / 4) * (1 / target_error)))
    speedup = params.numPaths / grover_iterations
    
    # 3. Oracle Complexity (Heston Logic costs)
    cost_mult = 20 * precision_bits
    cost_add = 4 * precision_bits
    cost_sqrt = 40 * precision_bits
    cost_gaussian = 100 * precision_bits
    
    # Per Step
    t_gates_per_step = (2 * cost_gaussian + 1 * cost_sqrt + 4 * cost_mult + 3 * cost_add)
    oracle_t_depth = params.timeSteps * t_gates_per_step
    
    # 4. Totals
    total_t_gates = oracle_t_depth * grover_iterations
    total_cnots = total_t_gates * 2.5
    
    # 5. Logical Qubits
    logical_state_qubits = 2 * precision_bits
    logical_ancilla_qubits = 6 * precision_bits
    qae_qubits = int(np.ceil(np.log2(grover_iterations))) + 2
    
    total_logical_qubits = logical_state_qubits + logical_ancilla_qubits + qae_qubits
    
    return QuantumMetrics(
        estimatedQubits=total_logical_qubits,
        circuitDepth=int(np.ceil(oracle_t_depth * grover_iterations)),
        theoreticalSpeedup=speedup,
        estimatedQuantumError=target_error,
        tGateCount=int(np.ceil(total_t_gates)),
        cnotCount=int(np.ceil(total_cnots)),
        oracleDepth=int(oracle_t_depth),
        groverIterations=grover_iterations,
        qubitBreakdown={
            "state": logical_state_qubits,
            "ancilla": logical_ancilla_qubits,
            "qae": qae_qubits
        }
    )

def run_heston_simulation(params: HestonParams) -> SimulationResult:
    start_time = time.time()
    
    S0 = params.S0
    K = params.K
    r = params.r
    T = params.T
    v0 = params.v0
    theta = params.theta
    kappa = params.kappa
    xi = params.xi
    rho = params.rho
    num_paths = params.numPaths
    time_steps = params.timeSteps
    
    dt = T / time_steps
    sqrt_dt = np.sqrt(dt)
    
    # Initialize arrays
    # We simulate all paths at once using NumPy vectorization
    
    # Random numbers
    z1 = np.random.normal(0, 1, (num_paths, time_steps))
    z2 = np.random.normal(0, 1, (num_paths, time_steps))
    
    # Correlate Brownian motions
    w1 = z1
    w2 = rho * z1 + np.sqrt(1 - rho**2) * z2
    
    # Initialize price and variance paths
    # We only need to store the full path for a few visualization paths
    # For the rest, we can just keep the current state to save memory if needed,
    # but for 50k paths * 100 steps, it's fine to keep all in memory or just iterate.
    # Let's iterate to be safe and clear.
    
    # Current state
    X = np.full(num_paths, np.log(S0))
    v = np.full(num_paths, v0)
    
    # Store visualization paths (first 50)
    paths_to_visualize = 50
    visualization_paths = []
    
    # Initial point for viz
    for i in range(paths_to_visualize):
        visualization_paths.append({
            "time": 0,
            "value": S0,
            "vol": v0,
            "pathId": i
        })
        
    for t in range(1, time_steps + 1):
        # Current step randoms
        dw1 = w1[:, t-1]
        dw2 = w2[:, t-1]
        
        # Full Truncation for variance
        v_prev = np.maximum(0, v)
        sqrt_v_prev = np.sqrt(v_prev)
        
        # Heston Variance Process
        v = v + kappa * (theta - v_prev) * dt + xi * sqrt_v_prev * sqrt_dt * dw2
        
        # Log-Asset Price Process
        X = X + (r - 0.5 * v_prev) * dt + sqrt_v_prev * sqrt_dt * dw1
        
        # Store viz paths
        current_prices = np.exp(X[:paths_to_visualize])
        current_vols = np.maximum(0, v[:paths_to_visualize])
        
        for i in range(paths_to_visualize):
            visualization_paths.append({
                "time": t * dt,
                "value": float(current_prices[i]),
                "vol": float(current_vols[i]),
                "pathId": i
            })

    final_prices = np.exp(X)
    
    # Payoff
    if params.optionType == 'Put':
        payoffs = np.maximum(0, K - final_prices)
    else:
        payoffs = np.maximum(0, final_prices - K)
        
    mean_payoff = np.mean(payoffs)
    price = np.exp(-r * T) * mean_payoff
    
    # Standard Error
    variance = np.var(payoffs)
    standard_error = (np.sqrt(variance) / np.sqrt(num_paths)) * np.exp(-r * T)
    
    end_time = time.time()
    
    return SimulationResult(
        price=float(price),
        standardError=float(standard_error),
        paths=visualization_paths,
        finalPrices=final_prices.tolist(),
        greeks=calculate_greeks(params, float(price)),
        executionTime=(end_time - start_time) * 1000 # ms
    )
