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
*   **Quantum Resource Estimator**: Uses **Surface Code** error correction models to estimate Physical Qubits, Code Distance, and Wall Clock Time for different hardware architectures (Superconducting vs Ion Trap).
*   **Real-Time Data Feed**: Uses **yfinance** to fetch real-time/delayed stock prices and market status.
*   **AI Analyst**: Generates Bloomberg-terminal style shorthand market insights using a local **Phi-3-mini** model (via Hugging Face Transformers).
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

### Advanced Resource Estimation
Unlike basic estimators that only count logical gates, Kvantum implements **Gidney's Windowed Arithmetic** model and **Surface Code** error correction to estimate the *true* cost of running this algorithm on real hardware.

1.  **Logical Layer**:
    *   Calculates the number of T-gates required for Heston arithmetic (Multiplication, Sqrt, Gaussian Sampling).
    *   Estimates Logical Qubits (State + Ancilla) and Circuit Depth.

2.  **Physical Layer (The Real Cost)**:
    *   **Surface Code**: Calculates the Code Distance ($d$) required to suppress errors below the algorithm's failure threshold.
    *   **Physical Qubits**: $N_{phys} \approx 2d^2 \times N_{logical}$. This typically results in millions of physical qubits.
    *   **Wall Clock Time**: Estimates runtime based on the hardware's gate cycle time and the sequential injection of magic states.

### Hardware Benchmarking
The application allows you to benchmark the simulation against different quantum architectures:

*   **Superconducting (e.g., IBM, Google)**: Fast gate times (ns) but higher error rates, requiring larger code distances ($d$) and more physical qubits.
*   **Ion Trap (e.g., IonQ, Quantinuum)**: Slower gate times ($\mu s$) but lower error rates and better connectivity.
*   **Neutral Atom (e.g., QuEra)**: A middle ground with scalable qubit arrays.

---

## 🤖 AI & Agents

KVANTUM uses a local **Phi-3-mini** model (via `transformers`) for market analysis. No API keys are required, and all data stays local.

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
*   **AI**: Local Transformers (Phi-3-mini)

---

## 📦 Installation & Setup

### Prerequisites
*   **Node.js** (v18 or higher)
*   **Python** (v3.9 or higher)
*   **Disk Space**: ~10GB (for local AI models)

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

Install dependencies (including PyTorch & Transformers):

```bash
pip install -r requirements.txt
```

Start the server:

```bash
uvicorn main:app --reload
```
*Note: The first time you generate an insight, the application will download the Phi-3-mini model (~2.5GB). This may take a few minutes.*


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
