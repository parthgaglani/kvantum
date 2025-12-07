import { HestonParams, SimulationResult, QuantumMetrics } from '../types';

const API_URL = 'http://localhost:8000';

export const apiService = {
    async runSimulation(params: HestonParams): Promise<SimulationResult> {
        const response = await fetch(`${API_URL}/simulate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            throw new Error(`Simulation failed: ${response.statusText}`);
        }

        return response.json();
    },

    async getQuantumMetrics(params: HestonParams): Promise<QuantumMetrics> {
        const response = await fetch(`${API_URL}/quantum-metrics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            throw new Error(`Metrics calculation failed: ${response.statusText}`);
        }

        return response.json();
    },

    async getMarketData(ticker: string): Promise<{ price: number, source: string, time: string, status: string, change?: number, changePercent?: number } | null> {
        try {
            const response = await fetch(`${API_URL}/market-data/${ticker}`);
            if (!response.ok) return null;
            const data = await response.json();
            if (data.error) return null;
            return data;
        } catch (e) {
            console.error("Market data fetch failed", e);
            return null;
        }
    },

    async getGreeksTermStructure(params: HestonParams): Promise<{ time: number, delta: number, gamma: number, vega: number }[]> {
        try {
            const response = await fetch(`${API_URL}/greeks-term-structure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            if (!response.ok) return [];
            return response.json();
        } catch (e) {
            console.error("Greeks fetch failed", e);
            return [];
        }
    },

    async getMarketInsight(params: HestonParams, result: SimulationResult, quantum: QuantumMetrics, ticker: string): Promise<string> {
        try {
            const response = await fetch(`${API_URL}/market-insight`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ params, result, quantum, ticker })
            });
            if (!response.ok) return "SERVICE UNAVAILABLE.";
            const data = await response.json();
            return data.insight || "NO DATA.";
        } catch (e) {
            console.error("Insight fetch failed", e);
            return "SERVICE UNAVAILABLE.";
        }
    },

    async checkHealth(): Promise<boolean> {
        try {
            const res = await fetch(`${API_URL}/health`);
            return res.ok;
        } catch (e) {
            return false;
        }
    }
};
