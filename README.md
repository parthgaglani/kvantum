# KVANTUM - Quantum Option Pricing Dashboard

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-v19-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/typescript-v5-3178C6.svg)

**KVANTUM** is a high-fidelity financial dashboard that bridges Classical Quantitative Finance, Quantum Computing (FTQC), and Generative AI. It simulates European option pricing using the **Heston Stochastic Volatility Model** while simultaneously estimating the computational resources required to run the same simulation on a Fault-Tolerant Quantum Computer using **Iterative Quantum Amplitude Estimation (IQAE)**.

## 🚀 Features

*   **Stochastic Volatility Simulation**: Runs 1,000+ Monte Carlo paths in the browser using the Heston Model (Log-Euler discretization).
*   **Quantum Resource Estimator**: Calculates the theoretical logical qubits, T-gates, and circuit depth required for Quantum Advantage.
*   **Real-Time Data Feed**: Uses **Google Gemini 2.5 Flash** as an agent to fetch real-time stock prices and market status via Google Search grounding.
*   **AI Analyst**: Generates Bloomberg-terminal style shorthand market insights using LLMs.
*   **Interactive Greeks**: Real-time visualization of Delta, Gamma, and Vega sensitivity curves.
*   **Scandi-Minimalist UI**: Fully responsive, dark-mode enabled interface built with React and Tailwind CSS.

---

## 🧠 The Mathematics (Classical)

The application moves beyond the standard Black-Scholes model by incorporating stochastic volatility. It uses the **Heston Model**, defined by the following Stochastic Differential Equations (SDEs):

### 1. Asset Price Process
$$ dS_t = r S_t dt + \sqrt{v_t} S_t dW_1 $$

### 2. Variance Process
$$ dv_t = \kappa (\theta - v_t) dt + \xi \sqrt{v_t} dW_2 $$

Where:
*   $S_t$: Asset Price
*   $v_t$: Instantaneous Variance
*   $r$: Risk-free rate
*   $\kappa$: Rate of mean reversion
*   $\theta$: Long-run average variance
*   $\xi$: Volatility of volatility (Vol-of-Vol)
*   $dW_1, dW_2$: Wiener processes with correlation $\rho$.

### Simulation Logic
The app utilizes a **Log-Euler Discretization** scheme to ensure positivity of variance (Full Truncation) and numerical stability.

---

## ⚛️ The Physics (Quantum)

The "Quantum Acceleration" panel estimates the resources needed to achieve a Quadratic Speedup ($O(\epsilon^{-1})$) over classical Monte Carlo ($O(\epsilon^{-2})$) using **Quantum Amplitude Estimation (QAE)**.

### Resource Estimation Logic
The app calculates resources for a Fault-Tolerant Quantum Computer (FTQC) based on the complexity of the arithmetic required to simulate the Heston paths in a quantum circuit.

1.  **Precision Scaling**: 
    Determines the number of qubits needed to represent the state based on the desired target error $\epsilon = 1/\sqrt{N_{paths}}$.
    
2.  **Oracle Depth ($T_{depth}$)**:
    Estimates the number of T-gates (the most expensive operation in error-corrected quantum computing) required for the arithmetic operations (Multiplication, Sqrt, Gaussian sampling) per time step.

3.  **Grover Iterations ($k$)**:
    $$ k \approx \frac{\pi}{4\epsilon} $$
    The total circuit depth is roughly $T_{depth} \times k$.

---

## 🤖 AI & Agents

KVANTUM uses **Google Gemini 2.5** (via the `@google/genai` SDK) for two specific agentic tasks:

### 1. The Oracle (Data Feed)
Instead of paying for expensive financial APIs, the app prompts Gemini to act as a "High-Frequency Trading Data Feed Parser". 
*   **Tool**: `googleSearch`
*   **Logic**: It searches for the specific ticker, parses the "Regular Market Price", detects Pre-Market/After-Hours status, and returns a structured JSON object.

### 2. The Analyst (Insights)
Generates concise, "Bloomberg-style" shorthand syntax to summarize complex option data.
*   **Input**: Greeks, Moneyness, Volatility, and Quantum Metrics.
*   **Output**: Single-line summary (e.g., `SPX CALL 5850 | 2.1% OTM | D.53 G.0007 | Q-SPD 31.6x`).

---

## 🛠 Project Structure

```bash
├── App.tsx                 # Main dashboard layout and state management
├── components/
│   └── ui.tsx             # Reusable UI components (Cards, Sliders, Charts)
├── services/
│   └── geminiService.ts    # Gemini API integration (Price Fetching & Insights)
├── utils/
│   └── heston.ts           # Core Math: MC Simulation & Quantum Metrics
├── types.ts                # TypeScript interfaces
├── index.html              # Entry point (Tailwind CDN, Fonts)
└── README.md               # Documentation
```

## 💻 Setup & Usage

To run this application locally, you will need **Node.js** (v18+) and a package manager like **npm** or **yarn**.

### 1. Installation

Clone the repository and install the dependencies:

```bash
# Clone the repository
git clone https://github.com/yourusername/kvantum.git

# Navigate to project directory
cd kvantum

# Install dependencies
npm install
```

### 2. Environment Configuration

This application requires a Google Gemini API key to fetch live market data and generate AI insights.

1.  **Get an API Key**: Visit [Google AI Studio](https://aistudio.google.com/) to obtain a free API key.
2.  **Create Environment File**: Create a file named `.env` in the root directory of the project.
3.  **Add Key**: Add the following line to the `.env` file:

```env
API_KEY=your_actual_api_key_starts_with_AIzaSy...
```

> **Note**: Ensure `.env` is added to your `.gitignore` file to prevent accidentally publishing your API key to GitHub.

### 3. Running the Application

Start the local development server:

```bash
# Run using npm
npm start

# Or if using Vite
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the port displayed in your terminal).

### 4. How to Use

1.  **Select Asset**: Choose a stock or ETF from the dropdown (e.g., SPX, NVDA, AAPL). The app will attempt to fetch the live price using Gemini.
2.  **Configure Option**: 
    *   Set the **Strike Price (K)**.
    *   Adjust **Maturity (T)** (Time in years).
    *   Select **Call** or **Put**.
3.  **Adjust Dynamics**: Use the sliders to tweak Heston parameters like Volatility of Volatility ($\xi$) or Mean Reversion ($\kappa$).
4.  **Run Simulation**: Click "Run Simulation" to execute the Monte Carlo paths.
5.  **Generate Insight**: Click "Generate Insight" to have the AI analyze the simulation results and quantum metrics.

## ⚠️ Disclaimers

*   **Financial**: This application is for educational and research purposes only. Do not use it for actual trading.
*   **Quantum**: The quantum metrics are theoretical estimates for logical resource requirements on error-corrected hardware, not physical qubit counts on NISQ devices.
*   **Greeks**: While the simulation uses Heston dynamics for pricing, the "Greeks" visualization currently uses Black-Scholes analytical solutions as a proxy for sensitivity analysis.