
export type OptionType = 'Call' | 'Put';

export enum QuantumHardware {
  SUPERCONDUCTING = "superconducting",
  ION_TRAP = "ion_trap",
  NEUTRAL_ATOM = "neutral_atom"
}

export interface HestonParams {
  S0: number;
  K: number;
  r: number;
  T: number;
  v0: number;
  theta: number;
  kappa: number;
  xi: number;
  rho: number;
  numPaths: number;
  timeSteps: number;
  optionType: OptionType;
  hardware: QuantumHardware;
}

export interface SimulationResult {
  price: number;
  standardError: number;
  paths: { time: number; value: number; vol: number; pathId: number }[];
  finalPrices: number[];
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
  logicalQubits: number;
  logicalDepth: number;
  physicalQubits: number;
  codeDistance: number;
  wallClockTime: string;
  theoreticalSpeedup: number;
  tGateCount: number;
  cnotCount: number;
  groverIterations: number;
  qubitBreakdown: {
    state: number;
    ancilla: number;
    qae: number;
  };
}