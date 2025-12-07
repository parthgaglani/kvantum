# Kvantum: Quantum-Inspired Option Pricing Explorer

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React_19-61DAFB.svg)
![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688.svg)
![Python](https://img.shields.io/badge/python-3.9+-3776AB.svg)

**Kvantum** is a high-fidelity financial dashboard that bridges Classical Quantitative Finance, Quantum Computing (FTQC), and Generative AI. It simulates European option pricing using the **Heston Stochastic Volatility Model** while simultaneously estimating the computational resources required to run the same simulation on a Fault-Tolerant Quantum Computer using **Iterative Quantum Amplitude Estimation (IQAE)**.

This project demonstrates a modern architecture combining a high-performance **Python (FastAPI)** backend for numerical simulations with a responsive, data-rich **React** frontend.

---

## 🚀 Key Features

*   **Stochastic Volatility Simulation**: Runs 1,000+ Monte Carlo paths using the Heston Model (Log-Euler discretization).
*   **Quantum Resource Estimator**: Calculates the theoretical logical qubits, T-gates, and circuit depth required for Quantum Advantage.
*   **Real-Time Data Feed**: Uses **yfinance** to fetch real-time/delayed stock prices and market status.
*   **AI Analyst**: Generates Bloomberg-terminal style shorthand market insights using **Google Gemini 2.0 Flash** (Python SDK).
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
The backend utilizes a **Log-Euler Discretization** scheme to ensure positivity of variance (Full Truncation) and numerical stability, implemented efficiently in **NumPy**.

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

KVANTUM uses **Google Gemini 2.0** (via the `google-generativeai` Python SDK) for market analysis:

### The Analyst (Insights)
Generates concise, "Bloomberg-style" shorthand syntax to summarize complex option data.
*   **Input**: Greeks, Moneyness, Volatility, and Quantum Metrics.
*   **Output**: Single-line summary (e.g., `SPX CALL 5850 | 2.1% OTM | D.53 G.0007 | Q-SPD 31.6x`).

---

## 🛠️ Technology Stack

### Frontend
*   **Framework**: React 19 (Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS (Dark Mode enabled)
*   **Visualization**: Recharts (Responsive, animated charts)

### Backend
*   **Framework**: FastAPI (High-performance async Python)
*   **Numerics**: NumPy, SciPy (Vectorized Monte Carlo simulations)
*   **Data**: yfinance (Market data), Pydantic (Data validation)
*   **AI**: Google Generative AI SDK (Gemini integration)

---

## 📦 Installation & Setup

### Prerequisites
*   **Node.js** (v18 or higher)
*   **Python** (v3.9 or higher)
*   **Google Gemini API Key** (Get one at [aistudio.google.com](https://aistudio.google.com/))

### 1. Backend Setup

Navigate to the `backend` directory:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
# macOS/Linux
python -m venv .venv
source .venv/bin/activate

# Windows
python -m venv .venv
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Set your API Key (Required for AI Insights):

```bash
# macOS/Linux
export GEMINI_API_KEY="your_actual_api_key_here"

# Windows (PowerShell)
$env:GEMINI_API_KEY="your_actual_api_key_here"
```

Start the server:

```bash
uvicorn main:app --reload
```
*The backend will start at `http://127.0.0.1:8000`.*

### 2. Frontend Setup

Open a new terminal and navigate to the project root:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```
*The frontend will open at `http://localhost:5173`.*

---

## 📂 Project Structure

```
kvantum/
├── backend/                # Python FastAPI Server
│   ├── main.py            # API Endpoints
│   ├── heston_model.py    # Core Math & Physics Logic
│   └── requirements.txt   # Python Dependencies
├── components/             # React UI Components
│   └── ui.tsx             # Reusable UI (Cards, Buttons, Inputs)
├── services/               # Frontend Services
│   └── api.ts             # API Client for Backend Communication
├── App.tsx                 # Main Application Logic
├── types.ts                # TypeScript Interfaces
└── ...
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ by Parth Gaglani*
