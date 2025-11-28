
import { GoogleGenAI } from "@google/genai";
import { HestonParams, SimulationResult, QuantumMetrics } from "../types";

const getClient = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const fetchRealTimePrice = async (ticker: string, tickerSymbol: string): Promise<{ price: number, source?: string, time?: string, status?: string } | null> => {
  const ai = getClient();
  if (!ai) return null;

  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: 'America/New_York', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: 'short'
  };
  const nyTime = now.toLocaleDateString('en-US', options);

  const prompt = `
  Role: High-Frequency Trading Data Feed Parser.
  Task: Retrieve the MOST RECENT market data for "${tickerSymbol}" (${ticker}).
  
  Context:
  - Current Time (New York): ${nyTime}
  
  Instructions:
  1. Use googleSearch to find: "${tickerSymbol} stock price".
  2. Parse the result for:
     - The main "Regular Market Price".
     - The "After Hours" or "Pre-Market" price if visible and distinct.
     - The specific timestamp of the last trade.
     - The market status (OPEN, CLOSED, PRE-MARKET, AFTER-HOURS).
  
  Logic for Output Price:
  - IF status is 'OPEN' -> Use Regular Price.
  - IF status is 'AFTER-HOURS' or 'PRE-MARKET' -> Use the After/Pre market price.
  - IF status is 'CLOSED' -> Use the Closing Price (Regular Price).
  
  Output JSON (Strictly):
  {
    "price": number,
    "market_status": "OPEN" | "CLOSED" | "PRE-MARKET" | "AFTER-HOURS",
    "last_trade_time": "string (e.g. 'Nov 28, 4:00 PM EST')",
    "source": "Google Finance"
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    
    try {
      const jsonStr = text.replace(/```json|```/g, '').trim();
      const match = jsonStr.match(/\{[\s\S]*\}/); // Find JSON object
      const cleanJson = match ? match[0] : "{}";
      const data = JSON.parse(cleanJson);
      
      if (data && (typeof data.price === 'number' || !isNaN(parseFloat(data.price)))) {
         let finalPrice = parseFloat(data.price);
         const status = (data.market_status || 'CLOSED').toUpperCase();
         
         if ((status === 'AFTER-HOURS' || status === 'PRE-MARKET') && data.after_hours_price) {
             const ahPrice = parseFloat(data.after_hours_price);
             if (!isNaN(ahPrice)) finalPrice = ahPrice;
         }

         return { 
           price: finalPrice, 
           source: data.source || 'Google Finance',
           time: data.last_trade_time || 'Latest',
           status: status
         };
      }
    } catch (e) {
      console.warn("JSON parse failed for price fetch", e);
      const match = text.match(/\$\s*([\d,]+\.\d{2})/);
      if (match && match[1]) {
        return { 
          price: parseFloat(match[1].replace(/,/g, '')), 
          source: 'Market Data (Fallback)',
          time: 'Latest',
          status: 'CLOSED'
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Price Fetch Error:", error);
    return null;
  }
};

export const generateMarketInsight = async (
  params: HestonParams,
  result: SimulationResult,
  quantum: QuantumMetrics,
  tickerSymbol: string = "ASSET"
): Promise<string> => {
  const ai = getClient();
  if (!ai) {
    return "API KEY MISSING. UNABLE TO GENERATE QUANTUM ANALYTICS.";
  }
  
  const moneyness = params.S0 / params.K;
  let statusDir = "";
  // Check moneyness based on option type
  if (params.optionType === 'Put') {
      statusDir = moneyness < 1 ? "ITM" : "OTM";
  } else {
      statusDir = moneyness >= 1 ? "ITM" : "OTM";
  }
  
  const statusPct = (Math.abs(1 - moneyness) * 100).toFixed(2);
  const speedup = quantum.theoreticalSpeedup.toFixed(1);
  const iv = (Math.sqrt(params.v0) * 100).toFixed(1);
  const tGates = (quantum.tGateCount / 1000000).toFixed(1) + "M";

  const prompt = `
    Role: High-Frequency Trading Algorithm Output.
    Task: Generate a SINGLE LINE of ultra-concise Bloomberg-style shorthand data.
    
    Data:
    - Ticker: ${tickerSymbol}
    - Type: ${params.optionType.toUpperCase()} Option
    - Price: ${params.S0.toFixed(2)}
    - Moneyness: ${statusPct}% ${statusDir}
    - Greeks: D ${result.greeks.delta.toFixed(2)}, G ${result.greeks.gamma.toFixed(4)}, V ${result.greeks.vega.toFixed(2)}
    - IV: ${iv}%
    - Quantum: ${speedup}x Speedup, ${quantum.estimatedQubits} Logical Qubits
    
    Constraints:
    - STRICTLY ONE LINE.
    - USE "|" AS DELIMITER.
    - NO EXPLANATORY TEXT.
    - ABBREVIATIONS: D (Delta), G (Gamma), V (Vega), IV (Implied Vol), Q-SPD (Speedup).
    
    Format:
    [TICKER] [TYPE] [PRICE] | [Moneyness] | D.[val] G.[val] V.[val] | IV[val]% | Q-SPD [val]x
    
    Example:
    SPX CALL 5850.20 | 2.1% OTM | D.53 G.0007 V.19 | IV12.5% | Q-SPD 31.6x
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "NO DATA.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "SERVICE UNAVAILABLE.";
  }
};