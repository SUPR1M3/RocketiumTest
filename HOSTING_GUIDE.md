# Free Hosting Guide for Canvas Design Editor

This guide provides options for hosting your application for free for 1-2 days for demo purposes.

## 🎯 Quick Recommendations

**Best for Quick Demo (Easiest)**:
1. **Render.com** (Free tier) - Easiest setup, auto-deploys from GitHub
2. **Railway.app** (Free trial) - Simple, good for full-stack apps

**Best for Full Control**:
3. **Vercel (Frontend) + Render (Backend)** - Best performance, separate hosting

---

## Option 1: Render.com (Recommended - Easiest)

### Why Render?
- ✅ Free tier available
- ✅ Auto-deploys from GitHub
- ✅ Supports both frontend and backend
- ✅ Built-in MongoDB Atlas integration
- ✅ WebSocket support (Socket.io)
- ✅ Easy environment variable setup

### Setup Steps

#### 1. Prepare Your Code
```bash
# Make sure your code is pushed to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 2. Create MongoDB Atlas Database (Free)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a free cluster (M0 Sandbox)
4. Create database user
5. Get connection string (replace `<password>` with your password)
6. Add your IP to whitelist (or use `0.0.0.0/0` for all IPs)

#### 3. Deploy Backend on Render
1. Go to https://render.com
2. Sign up (free)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `canvas-editor-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: `backend`

6. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_atlas_connection_string
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ```

7. Click "Create Web Service"
8. Wait for deployment (~5-10 minutes)
9. Copy your backend URL (e.g., `https://canvas-editor-backend.onrender.com`)

#### 4. Deploy Frontend on Render
1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `canvas-editor-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Root Directory**: `frontend`

4. Add Environment Variable:
   ```
   VITE_API_URL=https://canvas-editor-backend.onrender.com/api
   ```

5. Click "Create Static Site"
6. Wait for deployment
7. Your app will be live at: `https://canvas-editor-frontend.onrender.com`

### Render Limitations (Free Tier)
- ⚠️ Services spin down after 15 minutes of inactivity
- ⚠️ First request after spin-down takes ~30 seconds
- ⚠️ 750 hours/month free (enough for 1-2 days demo)

---

## Option 2: Railway.app (Alternative)

### Why Railway?
- ✅ $5 free credit (enough for demo)
- ✅ Auto-deploys from GitHub
- ✅ Good WebSocket support
- ✅ Simple setup

### Setup Steps

#### 1. Deploy Backend
1. Go to https://railway.app
2. Sign up (use GitHub)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add service:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

6. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=your_mongodb_atlas_connection_string
   CORS_ORIGIN=https://your-frontend-url.up.railway.app
   ```

7. Deploy and copy URL

#### 2. Deploy Frontend
1. Add another service in same project
2. **Root Directory**: `frontend`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npx serve -s dist -l 3000`

5. Add Environment Variable:
   ```
   VITE_API_URL=https://your-backend-url.up.railway.app/api
   ```

---

## Option 3: Vercel (Frontend) + Render (Backend)

### Why This Combo?
- ✅ Vercel = Best frontend hosting (fast, free)
- ✅ Render = Good backend hosting (free tier)
- ✅ Best performance

### Setup Steps

#### Frontend on Vercel
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "New Project"
4. Import your repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. Add Environment Variable:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

7. Deploy (takes ~2 minutes)
8. Your frontend is live!

#### Backend on Render
Follow "Option 1: Render.com" backend steps above.

---

## Option 4: Netlify (Frontend) + Fly.io (Backend)

### Alternative Combo
- **Netlify**: Great for static sites
- **Fly.io**: Good for Node.js backends

---

## 🔧 Pre-Deployment Checklist

### Backend Configuration
1. ✅ Update CORS origin in `backend/src/app.ts`:
   ```typescript
   app.use(cors({
     origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
     credentials: true,
   }));
   ```

2. ✅ Update Socket.io CORS in `backend/src/index.ts`:
   ```typescript
   const io = new Server(server, {
     cors: {
       origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
       credentials: true,
     },
   });
   ```

3. ✅ Ensure production build works:
   ```bash
   cd backend
   npm run build
   npm start
   ```

### Frontend Configuration
1. ✅ Update API URL in `.env.production`:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

2. ✅ Ensure production build works:
   ```bash
   cd frontend
   npm run build
   npm run preview  # Test the build
   ```

### MongoDB Atlas Setup
1. ✅ Create free cluster
2. ✅ Create database user
3. ✅ Whitelist IP addresses (or use `0.0.0.0/0` for all)
4. ✅ Get connection string
5. ✅ Test connection locally

---

## 🚀 Quick Start Commands

### Local Testing Before Deploy
```bash
# Backend
cd backend
npm run build
npm start

# Frontend (in another terminal)
cd frontend
npm run build
npm run preview
```

### Environment Variables Template
```bash
# Backend (.env)
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/canvas-editor?retryWrites=true&w=majority
CORS_ORIGIN=https://your-frontend-url.com

# Frontend (.env.production)
VITE_API_URL=https://your-backend-url.com/api
```

---

## 📝 Deployment Tips

1. **Test Locally First**: Always test production builds locally before deploying
2. **Check Logs**: Use platform logs to debug issues
3. **Environment Variables**: Double-check all env vars are set correctly
4. **CORS**: Make sure CORS origins match your frontend URL exactly
5. **WebSocket**: Ensure your hosting platform supports WebSockets (most do)
6. **MongoDB**: Use MongoDB Atlas (free tier) - don't try to host MongoDB yourself

---

## 🐛 Common Issues

### Issue: CORS Errors
**Solution**: Check that `CORS_ORIGIN` in backend matches your frontend URL exactly (including `https://`)

### Issue: WebSocket Connection Failed
**Solution**: 
- Check that Socket.io CORS is configured
- Ensure hosting platform supports WebSockets
- Check firewall/network settings

### Issue: MongoDB Connection Failed
**Solution**:
- Verify connection string is correct
- Check IP whitelist in MongoDB Atlas
- Ensure password is URL-encoded

### Issue: Build Fails
**Solution**:
- Check build logs for errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version matches platform requirements

---

## 💰 Cost Summary

| Platform | Cost | Duration |
|----------|------|----------|
| Render.com | Free | 750 hours/month |
| Railway.app | $5 credit | ~1-2 days |
| Vercel | Free | Unlimited |
| MongoDB Atlas | Free | 512MB storage |

**Total Cost for 1-2 Day Demo: $0** ✅

---

## 🎯 Recommended Setup for Demo

**For Quickest Setup**: Use **Render.com** for both frontend and backend
- Single platform
- Easy setup
- Good enough for demo

**For Best Performance**: Use **Vercel (Frontend) + Render (Backend)**
- Fastest frontend
- Reliable backend
- Slightly more setup

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)
- [Railway Documentation](https://docs.railway.app/)

---

## ✅ Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] Backend API responds
- [ ] Can create new design
- [ ] Can add elements (text, shapes, images)
- [ ] Can save design
- [ ] Can load saved design
- [ ] Real-time collaboration works (test in 2 browsers)
- [ ] Comments work
- [ ] Export PNG works
- [ ] Undo/redo works

---

**Good luck with your demo! 🚀**

