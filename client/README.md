# Examinal Client

React frontend for the Examinal AI-powered examination platform.

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at http://localhost:5173

## Directory Structure

```
src/
├── components/   # Reusable UI components
├── pages/        # Page components
├── context/      # React context providers (auth, etc.)
├── App.jsx       # Main application
└── main.jsx      # Entry point
```

## Configuration

The app connects to the backend API at `http://localhost:8000`. Update `API_URL` in `App.jsx` if needed.
