# BENDLE DEPLOYMENT GUIDE - BACKEND (Fly.io)

## Prerequisites
- Fly.io account (create at https://fly.io)
- `flyctl` CLI installed (`which fly` should return path)

## Deployment Steps

### 1. Authenticate with Fly.io
```bash
fly auth login
# Opens browser for authentication
```

### 2. Create Fly.io App
```bash
cd /Users/bl10buer/Desktop/Bendle
fly launch --name movipa-backend --no-deploy --org personal
# Answer prompts:
# - Choose "yes" to create app
# - Choose region (ord = Chicago, or ams = Amsterdam, sin = Singapore)
# - Choose "no" when asked to deploy now
```

### 3. Set Required Secrets
```bash
fly secrets set \
  OPENAI_API_KEY="sk-..." \
  OPACUS_API_KEY="your-opacus-key" \
  FRONTEND_URL="https://movipa-xi.vercel.app"
```

### 4. Deploy Backend
```bash
fly deploy
# Deploys to https://movipa-backend.fly.dev
```

### 5. Update Frontend Backend URL (if needed)
If Fly.io app name differs, update `frontend/.env.production`:
```
REACT_APP_API_BASE_URL=https://movipa-backend.fly.dev
```

Then rebuild:
```bash
cd frontend && npm run build
vercel deploy --prod --yes
```

## Current Status
- ✅ Frontend: https://movipa-xi.vercel.app (deployed, no hardcoded localhost)
- ✅ Backend Docker: Ready at ./backend/Dockerfile
- ⏳ Backend Deployment: Requires Fly.io authentication + `fly deploy`
- ⏳ Backend URL in Frontend: Uses window.location.origin (works once backend is same-origin or after env update)

## Alternative: Quick Local Testing
To test backend locally before production deploy:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8001
```

Then frontend can reach backend at http://127.0.0.1:8001 (in dev mode).

## Notes
- Backend CORS is configured for https://movipa-xi.vercel.app
- Vercel dynamic routing uses window.location.origin fallback
- Once backend is deployed, API calls will work from production
