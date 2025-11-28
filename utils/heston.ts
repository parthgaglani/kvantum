
import { HestonParams, SimulationResult, QuantumMetrics } from '../types';

/**
 * Generates normally distributed random numbers using Box-Muller transform
 */
function randn_bm(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Runs a Heston Monte Carlo simulation
 */
export const runHestonSimulation = (params: HestonParams): SimulationResult => {
  const { S0, K, r, T, v0, theta, kappa, xi, rho, numPaths, timeSteps, optionType } = params;
  
  // Log-Euler Scheme requires careful step size
  const dt = T / timeSteps;
  const sqrtDt = Math.sqrt(dt);

  let sumPayoffs = 0;
  let sumPayoffsSquared = 0;
  const finalPrices: number[] = [];
  
  // Structure optimized for charting: We'll store a few paths as separate arrays
  // but for the result object, we stick to the format the UI expects.
  const visualizationPaths: { time: number; value: number; vol: number; pathId: number }[] = [];
  const pathsToVisualize = 50; // Increased for "Cloud" effect

  const startTime = performance.now();

  for (let i = 0; i < numPaths; i++) {
    // Log-Euler initialization: model log price X = ln(S)
    let X = Math.log(S0);
    let v = v0;
    
    const isVisual = i < pathsToVisualize;
    if (isVisual) {
      visualizationPaths.push({ time: 0, value: S0, vol: v, pathId: i });
    }

    for (let t = 1; t <= timeSteps; t++) {
      const z1 = randn_bm();
      const z2 = randn_bm();
      
      const w1 = z1;
      const w2 = rho * z1 + Math.sqrt(1 - rho * rho) * z2;

      // Full Truncation for variance
      const vPrev = Math.max(0, v); 
      const sqrtVPrev = Math.sqrt(vPrev);
      
      // Heston Variance Process
      v = v + kappa * (theta - vPrev) * dt + xi * sqrtVPrev * sqrtDt * w2;
      
      // Log-Asset Price Process (Ito's Lemma application for ln(S))
      // d(ln S) = (r - 0.5*v)dt + sqrt(v)dW1
      X = X + (r - 0.5 * vPrev) * dt + sqrtVPrev * sqrtDt * w1;
      
      const S_current = Math.exp(X);

      if (isVisual) {
        visualizationPaths.push({ time: t * dt, value: S_current, vol: Math.max(0, v), pathId: i });
      }
    }

    const S_final = Math.exp(X);
    
    // Payoff Logic based on Option Type
    const payoff = optionType === 'Put' 
        ? Math.max(0, K - S_final) 
        : Math.max(0, S_final - K);

    sumPayoffs += payoff;
    sumPayoffsSquared += payoff * payoff;
    finalPrices.push(S_final);
  }

  const endTime = performance.now();
  const meanPayoff = sumPayoffs / numPaths;
  const price = Math.exp(-r * T) * meanPayoff;
  
  const variance = (sumPayoffsSquared / numPaths - meanPayoff * meanPayoff);
  const standardError = (Math.sqrt(variance) / Math.sqrt(numPaths)) * Math.exp(-r * T);

  return {
    price,
    standardError,
    paths: visualizationPaths,
    finalPrices,
    greeks: calculateGreeks(params, price), 
    executionTime: endTime - startTime
  };
};

// Helper for BS Greeks (using average parameters as proxy for Heston Greeks)
export function calculateGreeks(params: HestonParams, currentPrice: number) {
   const { S0, K, r, T, theta, optionType } = params;
   const vol = Math.sqrt(theta);
   const safeT = Math.max(0.0001, T);
   
   const d1 = (Math.log(S0 / K) + (r + 0.5 * vol * vol) * safeT) / (vol * Math.sqrt(safeT));
   const d2 = d1 - vol * Math.sqrt(safeT);

   const pdf = (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
   const cdf = (x: number) => {
       let t = 1 / (1 + .2316419 * Math.abs(x));
       let d = .398942280401432678 * Math.exp(-x * x / 2);
       let prob = d * t * (.319381530 + t * (-.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
       if (x > 0) prob = 1 - prob;
       return prob;
   };

   const Nd1 = cdf(d1);
   const Nd2 = cdf(d2);
   const Nminusd2 = cdf(-d2);
   
   // Gamma and Vega are the same for Calls and Puts
   const gamma = pdf(d1) / (S0 * vol * Math.sqrt(safeT));
   const vega = S0 * Math.sqrt(safeT) * pdf(d1) / 100;

   let delta, thetaVal, rho;

   if (optionType === 'Put') {
       delta = Nd1 - 1;
       // Theta for Put
       thetaVal = (- (S0 * vol * pdf(d1)) / (2 * Math.sqrt(safeT)) + r * K * Math.exp(-r * safeT) * Nminusd2) / 365;
       // Rho for Put
       rho = -K * safeT * Math.exp(-r * safeT) * Nminusd2 / 100;
   } else {
       // Call Defaults
       delta = Nd1;
       thetaVal = (- (S0 * vol * pdf(d1)) / (2 * Math.sqrt(safeT)) - r * K * Math.exp(-r * safeT) * Nd2) / 365;
       rho = K * safeT * Math.exp(-r * safeT) * Nd2 / 100;
   }

   return {
     delta,
     gamma,
     vega,
     theta: thetaVal,
     rho
   };
}

/**
 * High-Fidelity Analytical Resource Estimator for FTQC
 */
export const calculateQuantumMetrics = (params: HestonParams, classicalError: number): QuantumMetrics => {
    // 1. Precision Scaling
    const targetError = 1 / Math.sqrt(params.numPaths);
    const precisionBits = Math.ceil(10 + Math.max(0, -Math.log2(targetError)));
    
    // 2. QAE Complexity
    const groverIterations = Math.ceil((Math.PI / 4) * (1 / targetError));
    const speedup = params.numPaths / groverIterations;
    
    // 3. Oracle Complexity (Heston Logic costs)
    const costMult = 20 * precisionBits;
    const costAdd = 4 * precisionBits;
    const costSqrt = 40 * precisionBits;
    const costGaussian = 100 * precisionBits;
    
    // Per Step
    const tGatesPerStep = (2 * costGaussian + 1 * costSqrt + 4 * costMult + 3 * costAdd);
    const oracleTDepth = params.timeSteps * tGatesPerStep;
    
    // 4. Totals
    const totalTGates = oracleTDepth * groverIterations;
    const totalCNOTs = totalTGates * 2.5;
    
    // 5. Logical Qubits
    // Add logic to handle Put option comparator in quantum circuit (minimal overhead, 1-2 bits)
    const logicalStateQubits = 2 * precisionBits; 
    const logicalAncillaQubits = 6 * precisionBits; 
    const qaeQubits = Math.ceil(Math.log2(groverIterations)) + 2;
    
    const totalLogicalQubits = logicalStateQubits + logicalAncillaQubits + qaeQubits;

    return {
        estimatedQubits: totalLogicalQubits,
        circuitDepth: Math.ceil(oracleTDepth * groverIterations),
        theoreticalSpeedup: speedup,
        estimatedQuantumError: targetError,
        tGateCount: Math.ceil(totalTGates),
        cnotCount: Math.ceil(totalCNOTs),
        oracleDepth: oracleTDepth,
        groverIterations: groverIterations,
        qubitBreakdown: {
            state: logicalStateQubits,
            ancilla: logicalAncillaQubits,
            qae: qaeQubits
        }
    };
};