#!/bin/bash
set -e

echo "🚀 Deploying QuokkaQ Demo to Netlify..."
echo ""

# Check if there are uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo "⚠️  Warning: You have uncommitted changes"
  echo ""
  git status -s
  echo ""
  read -p "Do you want to commit these changes? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter commit message: " commit_msg
    git add .
    git commit -m "$commit_msg"
  fi
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

# Build and deploy to Netlify
echo "🔨 Building project..."
npm run build

echo "🚀 Deploying to Netlify..."
netlify deploy --prod

echo ""
echo "✅ Deployment complete!"
echo "🌐 Live at: https://quokka-demo.netlify.app"
