
export interface HestonParams {
  S0: number; // Initial Stock Price
  K: number;  // Strike Price
  r: number;  // Risk-free Rate
  T: number;  // Time to Maturity (years)
  v0: number; // Initial Volatility (Variance)
  theta: number; // Long-term Variance
  kappa: number; // Mean Reversion Rate
  xi: number; // Volatility of Volatility
  rho: number; // Correlation
  numPaths: number; // Number of Monte Carlo paths
  timeSteps: number; // Steps per path
  optionType: 'Call' | 'Put'; // New field
}

export interface SimulationResult {
  price: number;
  standardError: number;
  paths: { time: number; value: number; vol: number; pathId: number }[]; // Sample paths for viz
  finalPrices: number[]; // Distribution
  greeks: {
    delta: number;
    gamma: number;
    vega: number;
    theta: number;
    rho: number;
  };
  executionTime: number;
}

export interface QuantumMetrics {
  estimatedQubits: number;
  circuitDepth: number;
  theoreticalSpeedup: number; // Ratio
  estimatedQuantumError: number;
  tGateCount: number;      // Fault-tolerant cost metric
  cnotCount: number;       // Entanglement cost metric
  oracleDepth: number;     // Depth of a single step
  groverIterations: number; // Number of QAE iterations
  qubitBreakdown: {        // Detailed resource allocation
    state: number;
    ancilla: number;
    qae: number;
  };
}