# AI Pneumonia Detection from Chest X-Rays
- Backend: FastAPI + PyTorch + ResNet18
- Frontend: React + Tailwind (Coming Soon)
- Status: In Development (Started April 2026)

## Production Deployment (Low-Lag Setup)

### 1) Deploy backend on Render
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1 --loop uvloop --http httptools
```

- Health check path: `/health`

Recommended environment variables:
- `PYTHON_VERSION=3.10.12`
- `PYTHONUNBUFFERED=1`
- `TORCH_NUM_THREADS=2`
- `OMP_NUM_THREADS=2`
- `INFERENCE_CONCURRENCY=1`
- `INFERENCE_MAX_IMAGE_BYTES=6291456`

Why this is faster:
- Model is loaded once at startup and warmed up.
- Inference is run in a worker thread so requests do not block the event loop.
- Concurrency is limited to prevent CPU thrashing.
- Large images are rejected early.

### 2) Deploy frontend on Vercel or Netlify
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

Set this environment variable in frontend hosting:
- `VITE_API_URL=https://<your-backend-service>.onrender.com`

### 3) Important anti-lag checks
- Keep backend worker count at `1` for memory-heavy PyTorch model on small instances.
- Upgrade instance type if p95 latency remains high under concurrent usage.
- Use compressed image uploads (already implemented in frontend uploader).
- Monitor `/health` and request timings (`latency_ms` in `/predict` response).