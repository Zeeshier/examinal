# Examinal Server

FastAPI backend for the Examinal AI-powered examination platform.

## Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

- `GET /api/health` - Health check endpoint
