#!/bin/bash
# Wrapper script to generate director portraits
# Sets up environment and runs the Node.js script

set -e

echo "🎭 Director Portrait Generator"
echo "=============================="
echo ""

# Check for required environment variables
if [ -z "$REPLICATE_API_TOKEN" ]; then
  echo "❌ REPLICATE_API_TOKEN not set"
  echo "   Get it from: https://replicate.com/account/api-tokens"
  echo "   Export it: export REPLICATE_API_TOKEN=your-token"
  exit 1
fi

# Check for Google Cloud credentials
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ] && ! command -v gcloud &> /dev/null; then
  echo "⚠️  Google Cloud credentials not found"
  echo "   Set GOOGLE_APPLICATION_CREDENTIALS or run: gcloud auth application-default login"
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install Node.js first."
  exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install replicate @google-cloud/storage @supabase/supabase-js dotenv
fi

# Run the script
echo "🚀 Starting portrait generation..."
node scripts/generate-director-portraits.js
