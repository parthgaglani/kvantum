import numpy as np
import time
from scipy.stats import norm
from pydantic import BaseModel
from typing import List, Literal, Dict
from enum import Enum

class QuantumHardware(str, Enum):
    SUPERCONDUCTING = "superconducting"
    ION_TRAP = "ion_trap"
    NEUTRAL_ATOM = "neutral_atom"

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
    hardware: QuantumHardware = QuantumHardware.SUPERCONDUCTING

class SimulationResult(BaseModel):
    price: float
    standardError: float
    paths: List[Dict]
    finalPrices: List[float]
    greeks: Dict[str, float]
    executionTime: float

class QuantumMetrics(BaseModel):
    # Logical Resources
    logicalQubits: int
    logicalDepth: int
    
    # Physical Resources (The Real Cost)
    physicalQubits: int
    codeDistance: int
    wallClockTime: str # Human readable time
    
    # Algorithmic Metrics
    theoreticalSpeedup: float
    tGateCount: int
    cnotCount: int
    groverIterations: int
    
    # Breakdown
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
    # --- 1. Algorithmic Complexity (Logical Layer) ---
    
    # Precision scaling: Error goes as 1/sqrt(N)
    target_error = 1 / np.sqrt(params.numPaths)
    
    # Number of bits needed for fixed-point arithmetic to match Monte Carlo error
    # Heuristic: 10 base bits + log2(1/error)
    precision_bits = int(np.ceil(10 + max(0, -np.log2(target_error))))
    
    # Grover Iterations for Amplitude Estimation
    # k ~ pi/(4*epsilon)
    grover_iterations = int(np.ceil((np.pi / 4) * (1 / target_error)))
    speedup = params.numPaths / grover_iterations
    
    # Oracle Cost (One Heston Step)
    # Based on "Windowed Arithmetic" costs (Gidney et al.)
    # Multiplications are expensive (T-gates), Additions are cheap (Clifford)
    cost_mult = 20 * precision_bits  # T-gates per multiplication
    cost_add = 4 * precision_bits    # T-gates per addition (carry ripple)
    cost_sqrt = 40 * precision_bits  # Newton-Raphson iterations
    cost_gaussian = 100 * precision_bits # Box-Muller or Ziggurat
    
    # Operations per time step in Heston (Euler-Maruyama)
    # 2 Gaussians, 1 Sqrt (vol), 4 Mults, 3 Adds
    t_gates_per_step = (2 * cost_gaussian + 1 * cost_sqrt + 4 * cost_mult + 3 * cost_add)
    oracle_t_depth = params.timeSteps * t_gates_per_step
    
    # Total Logical T-Gates
    total_t_gates = oracle_t_depth * grover_iterations
    total_cnots = total_t_gates * 2.5 # Rough heuristic for CNOT/T ratio
    
    # Logical Qubits
    # State: 2 * precision (Asset + Vol)
    # Ancilla: Needed for arithmetic (carry bits, etc.) ~ 4x state
    logical_state_qubits = 2 * precision_bits
    logical_ancilla_qubits = 4 * precision_bits
    qae_qubits = int(np.ceil(np.log2(grover_iterations))) + 2
    
    total_logical_qubits = logical_state_qubits + logical_ancilla_qubits + qae_qubits
    
    # --- 2. Hardware Specifications (Physical Layer) ---
    
    # Hardware Constants
    if params.hardware == QuantumHardware.ION_TRAP:
        # Ion Trap (e.g., IonQ Aria/Forte)
        # Pros: Low error, All-to-all connectivity
        # Cons: Slow gate speeds
        phys_gate_time = 100e-6 # 100 microseconds (slow)
        phys_error_rate = 1e-4  # 0.01% error (very good)
        cycle_time = 1e-3       # Surface code cycle (slow)
    elif params.hardware == QuantumHardware.NEUTRAL_ATOM:
        # Neutral Atom (e.g., QuEra, Pasqal)
        phys_gate_time = 1e-6   # 1 microsecond
        phys_error_rate = 1e-3  # 0.1%
        cycle_time = 10e-6
    else: # SUPERCONDUCTING (Default)
        # Superconducting (e.g., IBM Eagle/Heron, Google Sycamore)
        # Pros: Fast gates
        # Cons: Higher error, Nearest-neighbor connectivity
        phys_gate_time = 50e-9  # 50 nanoseconds (fast)
        phys_error_rate = 1e-3  # 0.1% error
        cycle_time = 1e-6       # 1 microsecond cycle
        
    # --- 3. Error Correction (Surface Code) ---
    
    # We need the Logical Error Rate per T-gate to be << 1 / Total_T_Gates
    # Let's say we want P_fail < 1% for the whole algorithm
    required_logical_error = 0.01 / max(1, total_t_gates)
    
    # Surface Code Distance Formula (Fowler et al.)
    # P_logical ~ 0.1 * (100 * P_physical)^((d+1)/2)
    # Solve for d:
    # log(P_logical / 0.1) ~ ((d+1)/2) * log(100 * P_physical)
    # d ~ 2 * log(P_logical / 0.1) / log(100 * P_physical) - 1
    
    # Avoid log(0) or division by zero
    p_phys_scaled = 100 * phys_error_rate
    if p_phys_scaled >= 1:
        # Error too high for threshold!
        d = 999 # Impossible
    else:
        numerator = np.log(required_logical_error / 0.1)
        denominator = np.log(p_phys_scaled)
        d = int(np.ceil(2 * (numerator / denominator) - 1))
        
    # Ensure d is odd
    if d % 2 == 0: d += 1
    if d < 3: d = 3 # Minimum distance
    
    # Physical Qubits per Logical Qubit
    # Surface code requires 2*d^2 physical qubits per logical qubit
    physical_qubits_per_logical = 2 * (d**2)
    total_physical_qubits = total_logical_qubits * physical_qubits_per_logical
    
    # --- 4. Runtime Estimation ---
    
    # Wall Clock Time = Total T-Gates * Time per T-Gate
    # In surface code, T-gates are injected via Magic State Distillation
    # Time per T-gate is roughly d * cycle_time (sequential injection) 
    # or just cycle_time if parallelized (optimistic). 
    # Let's be realistic/conservative: d * cycle_time
    
    time_per_logical_op = d * cycle_time
    total_seconds = total_t_gates * time_per_logical_op
    
    # Format time
    if total_seconds < 1:
        time_str = f"{total_seconds*1000:.1f} ms"
    elif total_seconds < 60:
        time_str = f"{total_seconds:.1f} sec"
    elif total_seconds < 3600:
        time_str = f"{total_seconds/60:.1f} min"
    elif total_seconds < 86400:
        time_str = f"{total_seconds/3600:.1f} hrs"
    elif total_seconds < 31536000:
        time_str = f"{total_seconds/86400:.1f} days"
    else:
        time_str = f"{total_seconds/31536000:.1f} years"
        
    return QuantumMetrics(
        logicalQubits=total_logical_qubits,
        logicalDepth=int(np.ceil(oracle_t_depth * grover_iterations)),
        physicalQubits=total_physical_qubits,
        codeDistance=d,
        wallClockTime=time_str,
        theoreticalSpeedup=speedup,
        tGateCount=int(np.ceil(total_t_gates)),
        cnotCount=int(np.ceil(total_cnots)),
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
