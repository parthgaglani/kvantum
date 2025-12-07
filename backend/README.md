# Kvantum Backend

This is the Python backend for the Kvantum application. It provides API endpoints for Heston model simulation and quantum metrics calculation.

## Setup

1.  **Create a virtual environment (optional but recommended):**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Running the Server

Run the FastAPI server using Uvicorn:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
The frontend expects the backend to be running on this port.
