# Deployment Guide for Render

## Deploy to Render

### Backend Deployment

1. **Create Backend Web Service:**
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New +" → "Web Service"
   - Connect your GitHub repo or upload code
   - Settings:
     - **Name**: `file-transfer-backend`
     - **Environment**: `Node`
     - **Build Command**: `cd backend && npm install`
     - **Start Command**: `cd backend && npm start`
     - **Port**: `5050` (or use environment variable `PORT`)
   
2. **Note your backend URL**: `https://your-backend.onrender.com`

### Frontend Deployment

1. **Update Frontend to use Backend URL:**
   
   Before deploying, update `frontend/src/App.jsx`:
   
   ```javascript
   const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5050'
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api'
   ```

2. **Create Frontend Static Site:**
   - Click "New +" → "Static Site"
   - Settings:
     - **Name**: `file-transfer-frontend`
     - **Build Command**: `cd frontend && npm install && npm run build`
     - **Publish Directory**: `frontend/dist`
   - **Environment Variables**:
     - `VITE_WS_URL` = `wss://your-backend.onrender.com`
     - `VITE_API_URL` = `https://your-backend.onrender.com/api`

3. **Note your frontend URL**: `https://your-frontend.onrender.com`

### Update Backend CORS

Update `backend/server.js` to allow your frontend domain:

```javascript
app.use(cors({
  origin: ['https://your-frontend.onrender.com', 'http://localhost:3000']
}));
```

## Access via Tor

Once deployed:
1. Open **Brave with Tor** (Private Window with Tor)
2. Navigate to: `https://your-frontend.onrender.com`
3. ✅ Works perfectly through Tor!

## Alternative: Deploy Both as One Service

You can also serve the frontend from the backend:

1. Build frontend: `cd frontend && npm run build`
2. Copy `frontend/dist` to `backend/public`
3. In `backend/server.js` add:
   ```javascript
   app.use(express.static('public'));
   ```
4. Deploy only backend, access via backend URL

## Free Tier Notes

- Render free tier may spin down after inactivity
- First request might take 30-60 seconds to wake up
- Upgrade to paid plan for always-on service
