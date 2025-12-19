#!/bin/bash
set -e

# Build script for production deployment
# Injects Supabase credentials from environment variables into the HTML

echo "🔨 Building for production..."

# Create a temporary config file with production values
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_ANON_KEY" ]; then
  cat > config.prod.js <<EOF
// Auto-generated production config
window.SUPABASE_URL = '$SUPABASE_URL';
window.SUPABASE_ANON_KEY = '$SUPABASE_ANON_KEY';
EOF
  echo "✅ Production config created"
else
  echo "⚠️  SUPABASE_URL and SUPABASE_ANON_KEY not set, using default config.js"
fi

echo "✅ Build complete"
