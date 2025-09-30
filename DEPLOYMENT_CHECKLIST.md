# 🚀 Deployment Checklist for Code Snippet Manager

## Prerequisites ✅
- [x] GitHub repository created and uploaded
- [x] Project structure ready
- [x] LICENSE and README.md in place

## Step 1: MongoDB Atlas Setup (5 minutes)
1. [ ] Go to https://mongodb.com/atlas
2. [ ] Create free account
3. [ ] Create free cluster (M0 Sandbox)
4. [ ] Create database user
5. [ ] Whitelist all IP addresses (0.0.0.0/0)
6. [ ] Get connection string (looks like: mongodb+srv://username:password@cluster.mongodb.net/dbname)

## Step 2: Deploy Backend to Railway (10 minutes)
1. [ ] Go to https://railway.app
2. [ ] Login with GitHub
3. [ ] Click "Deploy from GitHub repo"
4. [ ] Select: Harshith-517/code-snippet-manager
5. [ ] Set Root Directory: `server`
6. [ ] Add Environment Variables:
   - [ ] NODE_ENV=production
   - [ ] PORT=5000
   - [ ] MONGO_URI=[your MongoDB Atlas connection string]
   - [ ] JWT_SECRET=[generate a random 32+ character string]
   - [ ] CLIENT_URL=[will update after frontend deployment]
7. [ ] Deploy and wait for success
8. [ ] Copy your Railway app URL (e.g., https://your-app.up.railway.app)

## Step 3: Deploy Frontend to Vercel (5 minutes)
1. [ ] Go to https://vercel.com
2. [ ] Continue with GitHub
3. [ ] Import Project
4. [ ] Select: Harshith-517/code-snippet-manager
5. [ ] Set Root Directory: `client`
6. [ ] Add Environment Variable:
   - [ ] VITE_API_URL=[your Railway URL]/api
7. [ ] Deploy and wait for success
8. [ ] Copy your Vercel app URL (e.g., https://your-app.vercel.app)

## Step 4: Update Backend Configuration
1. [ ] Go back to Railway dashboard
2. [ ] Update CLIENT_URL environment variable with your Vercel URL
3. [ ] Redeploy the backend service

## Step 5: Test Your Live Application
1. [ ] Visit your Vercel URL
2. [ ] Test user registration
3. [ ] Test snippet creation
4. [ ] Test smart search functionality
5. [ ] Test collaborative editing

## 🔧 Environment Variables Reference

### Railway (Backend)
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/code-snippet-manager
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
CLIENT_URL=https://your-vercel-app.vercel.app
```

### Vercel (Frontend)
```
VITE_API_URL=https://your-railway-app.up.railway.app/api
```

## 🎯 Success Indicators
- [ ] Backend deploys without errors
- [ ] Frontend builds and deploys successfully
- [ ] Database connection established
- [ ] API endpoints responding
- [ ] Frontend can communicate with backend
- [ ] Authentication working
- [ ] Snippet CRUD operations working

## 🐛 Troubleshooting
- **Build fails**: Check Node.js version compatibility
- **Database connection error**: Verify MongoDB Atlas connection string and IP whitelist
- **API calls fail**: Check CORS settings and environment variables
- **Authentication issues**: Verify JWT_SECRET is set

## 🌐 Your Live URLs
- Frontend: https://your-app-name.vercel.app
- Backend API: https://your-app-name.up.railway.app
- Repository: https://github.com/Harshith-517/code-snippet-manager

## 📱 Share Your App
Once deployed, you can share your live application:
- Portfolio: Add to your resume/portfolio
- LinkedIn: Share your project
- GitHub: Add live demo links to README

Total Time: ~20 minutes
Cost: $0 (using free tiers)