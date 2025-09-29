# GitHub Setup Script for Code Snippet Manager
# Run this in PowerShell from your project root directory

Write-Host "🚀 Setting up GitHub for Code Snippet Manager..." -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
    git init
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

# Check git status
Write-Host "`n📋 Current Git Status:" -ForegroundColor Cyan
git status

# Add all files
Write-Host "`n📁 Adding all files to Git..." -ForegroundColor Yellow
git add .

# Show what will be committed
Write-Host "`n📝 Files to be committed:" -ForegroundColor Cyan
git status --short

# Prompt for commit message
$commitMessage = Read-Host "`n💬 Enter commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Initial commit: Code Snippet Manager MERN app with collaborative editing"
}

# Commit changes
Write-Host "`n💾 Committing changes..." -ForegroundColor Yellow
git commit -m $commitMessage

Write-Host "`n🎉 Local setup complete!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://github.com" -ForegroundColor White
Write-Host "2. Click '+' → 'New repository'" -ForegroundColor White
Write-Host "3. Name: 'code-snippet-manager'" -ForegroundColor White
Write-Host "4. Choose Public/Private" -ForegroundColor White
Write-Host "5. DON'T initialize with README" -ForegroundColor White
Write-Host "6. Click 'Create repository'" -ForegroundColor White
Write-Host "`n7. Then run these commands (replace USERNAME):" -ForegroundColor Cyan
Write-Host "   git remote add origin https://github.com/USERNAME/code-snippet-manager.git" -ForegroundColor White
Write-Host "   git branch -M main" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor White

Write-Host "`n🔗 After creating GitHub repo, would you like to add remote? (y/n)" -ForegroundColor Yellow
$addRemote = Read-Host

if ($addRemote -eq "y" -or $addRemote -eq "Y") {
    $githubUsername = Read-Host "Enter your GitHub username"
    $repoName = Read-Host "Enter repository name (default: code-snippet-manager)"
    
    if ([string]::IsNullOrWhiteSpace($repoName)) {
        $repoName = "code-snippet-manager"
    }
    
    $remoteUrl = "https://github.com/$githubUsername/$repoName.git"
    
    Write-Host "`n🔗 Adding remote origin..." -ForegroundColor Yellow
    git remote add origin $remoteUrl
    
    Write-Host "📤 Setting main branch and pushing..." -ForegroundColor Yellow
    git branch -M main
    git push -u origin main
    
    Write-Host "`n🎉 Successfully connected to GitHub!" -ForegroundColor Green
    Write-Host "Repository URL: https://github.com/$githubUsername/$repoName" -ForegroundColor Cyan
}

Write-Host "`n✅ Setup complete! Your project is ready for deployment." -ForegroundColor Green