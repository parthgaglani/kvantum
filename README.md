# Kvantum: Quantum-Inspired Option Pricing Explorer

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React_19-61DAFB.svg)
![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688.svg)
![Python](https://img.shields.io/badge/python-3.9+-3776AB.svg)

**Kvantum** is a cutting-edge financial engineering dashboard that bridges the gap between classical stochastic calculus and quantum computing algorithms. It provides an interactive environment to explore the **Heston Stochastic Volatility Model** and estimate the computational resources required to price options using **Quantum Amplitude Estimation (QAE)**.

This project demonstrates a modern architecture combining a high-performance Python backend for numerical simulations with a responsive, data-rich React frontend.

---

## 🚀 Key Features

### 1. Heston Model Simulation
*   **Real-time Monte Carlo**: Run thousands of asset price paths directly in your browser (visualized) and backend (computed).
*   **Stochastic Volatility**: Visualize how volatility evolves over time alongside asset prices, a key feature missing in standard Black-Scholes models.
*   **Interactive Parameters**: Dynamically adjust Spot Price ($S_0$), Strike ($K$), Volatility of Volatility ($\xi$), Mean Reversion ($\kappa$), and Correlation ($\rho$).

### 2. Quantum Resource Estimation
*   **QAE Metrics**: detailed breakdown of the quantum resources needed to achieve a target precision for option pricing.
*   **Metrics Calculated**:
    *   **Logical Qubits**: State preparation and ancilla qubits.
    *   **T-Gate Count**: The most expensive operation in fault-tolerant quantum computing.
    *   **Circuit Depth**: The length of the quantum circuit.
    *   **Theoretical Speedup**: Comparison of Quantum ($O(1/\epsilon)$) vs. Classical ($O(1/\epsilon^2)$) convergence.

### 3. Advanced Financial Analytics
*   **Greeks Term Structure**: Interactive visualization of Delta, Gamma, and Vega across different time-to-maturities.
*   **Live Market Data**: Integration with **yfinance** to fetch real-time (or delayed) stock prices and market status (Open/Closed/Pre-market).
*   **AI Market Insights**: Powered by **Google Gemini 2.0 Flash**, generating Bloomberg-terminal style concise market summaries based on simulation results and live data.

---

## 🛠️ Technology Stack

### Frontend
*   **Framework**: React 19 (Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS (Dark Mode enabled)
*   **Visualization**: Recharts (Responsive, animated charts)
*   **Icons**: Lucide React

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

## 🖥️ Usage Guide

1.  **Dashboard Overview**: The main screen shows the Heston parameters on the left and the simulation results on the right.
2.  **Running Simulations**:
    *   Adjust the sliders (e.g., increase $\xi$ to see "rougher" volatility paths).
    *   Click **"Run Simulation"** to trigger the Python backend.
    *   Watch the paths animate and the distribution graph update.
3.  **Market Data**:
    *   Select a ticker (e.g., `SPY`, `NVDA`) from the dropdown.
    *   The app will fetch the live price. Click **"Sync to Market"** to set the Spot Price ($S_0$) to the live price.
4.  **AI Insights**:
    *   After a simulation, click **"Generate Insight"**.
    *   Gemini will analyze the Greeks, Moneyness, and Quantum metrics to provide a professional trading summary.

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
