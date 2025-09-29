# 🚀 GitHub Setup Guide for Code Snippet Manager

## Step 1: Initialize Git Repository (If not done already)

Open PowerShell in your project root directory and run:

```powershell
# Navigate to your project directory
cd "c:\Users\anchu\Documents\Code Snippet"

# Initialize git repository (skip if already done)
git init

# Check current status
git status
```

## Step 2: Create .gitignore (Already exists - but verify)

Make sure your `.gitignore` includes:
```
# Dependencies
node_modules/
*/node_modules/

# Environment variables
.env
.env.local
.env.production
*/.env
*/.env.local
*/.env.production

# Build outputs
dist/
build/
*/dist/
*/build/

# Logs
*.log
npm-debug.log*

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

## Step 3: Add and Commit Files

```powershell
# Add all files to staging
git add .

# Make your first commit
git commit -m "Initial commit: Code Snippet Manager MERN app with collaborative editing"
```

## Step 4: Create GitHub Repository

### Option A: Using GitHub Website
1. Go to [github.com](https://github.com)
2. Click the "+" icon → "New repository"
3. Repository name: `code-snippet-manager`
4. Description: `A collaborative code snippet manager built with MERN stack`
5. Choose **Public** or **Private**
6. **DON'T** initialize with README (you already have files)
7. Click "Create repository"

### Option B: Using GitHub CLI (if installed)
```powershell
# Create repository directly from terminal
gh repo create code-snippet-manager --public --source=. --remote=origin --push
```

## Step 5: Connect Local Repository to GitHub

After creating the GitHub repository, you'll see commands like:

```powershell
# Add remote origin (replace USERNAME with your GitHub username)
git remote add origin https://github.com/USERNAME/code-snippet-manager.git

# Verify remote is added
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 6: Set up Branch Protection (Recommended)

1. Go to your GitHub repository
2. Settings → Branches
3. Add rule for `main` branch
4. Enable "Require pull request reviews before merging"

## Step 7: Create Development Workflow

```powershell
# Create development branch
git checkout -b develop
git push -u origin develop

# For new features
git checkout -b feature/feature-name
# Make changes, commit, then:
git push -u origin feature/feature-name
# Create Pull Request on GitHub
```

## 📋 Quick Commands Reference

```powershell
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push changes
git push

# Pull latest changes
git pull

# Create new branch
git checkout -b branch-name

# Switch branches
git checkout branch-name

# View commit history
git log --oneline
```

## 🔒 Environment Variables Security

**IMPORTANT**: Never commit environment variables to GitHub!

Your `.env` files should contain:
```bash
# Server .env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email
EMAIL_PASS=your_email_password

# Client .env
VITE_API_URL=your_api_url
```

## 🚀 Ready for Deployment!

Once connected to GitHub, you can easily deploy to:
- **Vercel**: Auto-deploy from GitHub
- **Railway**: Connect GitHub repo
- **Netlify**: Deploy from GitHub
- **Render**: Connect GitHub repository

## 📁 Repository Structure

Your repository will look like:
```
code-snippet-manager/
├── client/              # React frontend
├── server/              # Express backend  
├── .gitignore
├── DEPLOYMENT.md
├── README.md
└── package.json
```

## 🎯 Next Steps

1. ✅ Connect to GitHub
2. ✅ Set up deployment pipelines
3. ✅ Configure environment variables in deployment platforms
4. ✅ Test production deployment