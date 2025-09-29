# Code Snippet Manager Deployment Guide

## 🚀 Deployment Options

### Option 1: Vercel + Railway (Recommended)

#### Frontend Deployment (Vercel)
1. Build the client:
   ```bash
   cd client
   npm run build
   ```

2. Deploy to Vercel:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

#### Backend Deployment (Railway)
1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Select the `server` folder as root directory
4. Add environment variables in Railway dashboard

#### Database Setup (MongoDB Atlas)
1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free cluster
3. Get connection string and add to Railway environment variables

### Option 2: Netlify + Render

#### Frontend (Netlify)
1. Build: `cd client && npm run build`
2. Drag & drop `dist` folder to [netlify.com](https://netlify.com)

#### Backend (Render)
1. Create account at [render.com](https://render.com)
2. Connect GitHub repo
3. Set root directory to `server`
4. Add environment variables

### Option 3: DigitalOcean App Platform
1. Create account at [digitalocean.com](https://digitalocean.com)
2. Use App Platform
3. Connect GitHub repository
4. Configure both client and server components

## 📋 Pre-Deployment Checklist

- [ ] Set up MongoDB Atlas database
- [ ] Configure environment variables
- [ ] Update CORS settings for production domain
- [ ] Test API endpoints
- [ ] Update frontend API base URL
- [ ] Generate strong JWT secret
- [ ] Set up email service (if needed)

## 🔧 Configuration Updates Needed

1. Update `client/src/utils/api.js` with production API URL
2. Set CORS origin in `server/server.js` to your frontend domain
3. Configure MongoDB Atlas connection
4. Set all required environment variables

## 💰 Cost Estimates

- **Free Tier**: Vercel + Railway/Render + MongoDB Atlas = $0/month
- **Paid Tier**: DigitalOcean App Platform = ~$12/month
- **Enterprise**: AWS/Azure = Variable based on usage

## 🌐 Domain Setup

1. Purchase domain from Namecheap, GoDaddy, etc.
2. Point domain to deployment platform
3. Enable HTTPS (usually automatic)

## 📊 Monitoring & Analytics

Consider adding:
- Google Analytics
- Sentry for error tracking
- LogRocket for user session replay