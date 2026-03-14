# Deployment

## Local Development

### Backend
```bash
cd backend
pip3 install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/rooms`, `/games`, `/ws`, and `/game` to `localhost:8000`.

### Running Tests
```bash
cd backend
python -m pytest tests/ -v
```

## Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./battleship.db` | Database connection string |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | (empty, uses proxy) | Backend API base URL |
| `VITE_WS_URL` | (derived from location) | WebSocket base URL |

## Production Deployment

### Backend (Railway / Render / Fly.io)

1. Set `DATABASE_URL` to a PostgreSQL connection string (change `sqlite+aiosqlite` to `postgresql+asyncpg`)
2. Set `CORS_ORIGINS` to your frontend domain
3. Install `asyncpg` instead of `aiosqlite`:
   ```bash
   pip install asyncpg
   ```
4. Start command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### Frontend (Vercel / Netlify)

1. Set `VITE_API_URL` to your backend URL (e.g., `https://battleship-api.railway.app`)
2. Set `VITE_WS_URL` to your WebSocket URL (e.g., `wss://battleship-api.railway.app`)
3. Build command: `npm run build`
4. Output directory: `dist`

### Database Setup

For SQLite (development/small deployments):
- Database file is auto-created on first startup
- Tables are auto-created via SQLAlchemy `create_all`

For PostgreSQL (production):
- Create a database and set `DATABASE_URL`
- Tables are auto-created on startup

