@echo off
REM Code Snippet Manager - Deployment Script for Windows

echo 🚀 Starting deployment process...

REM Step 1: Build the client
echo 📦 Building client application...
cd client
call npm install
call npm run build
echo ✅ Client build complete

REM Step 2: Prepare server for production
echo 🔧 Preparing server for production...
cd ..\server
call npm install --production
echo ✅ Server dependencies installed

REM Step 3: Create production build info
echo 📝 Creating build info...
cd ..
echo { > build-info.json
echo   "buildDate": "%date% %time%", >> build-info.json
echo   "version": "1.0.0", >> build-info.json
echo   "environment": "production" >> build-info.json
echo } >> build-info.json

echo 🎉 Deployment preparation complete!
echo.
echo Next steps:
echo 1. Set up MongoDB Atlas database
echo 2. Deploy server to Railway/Render
echo 3. Deploy client to Vercel/Netlify
echo 4. Update environment variables
echo.
echo See DEPLOYMENT.md for detailed instructions.
pause