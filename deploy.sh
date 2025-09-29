#!/bin/bash

# Code Snippet Manager - Deployment Script
echo "🚀 Starting deployment process..."

# Step 1: Build the client
echo "📦 Building client application..."
cd client
npm install
npm run build
echo "✅ Client build complete"

# Step 2: Prepare server for production
echo "🔧 Preparing server for production..."
cd ../server
npm install --production
echo "✅ Server dependencies installed"

# Step 3: Create production build info
echo "📝 Creating build info..."
cd ..
echo "{
  \"buildDate\": \"$(date)\",
  \"version\": \"1.0.0\",
  \"environment\": \"production\"
}" > build-info.json

echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Set up MongoDB Atlas database"
echo "2. Deploy server to Railway/Render"
echo "3. Deploy client to Vercel/Netlify"
echo "4. Update environment variables"
echo ""
echo "See DEPLOYMENT.md for detailed instructions."