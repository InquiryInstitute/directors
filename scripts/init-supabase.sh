#!/bin/bash
set -e

# Complete Supabase initialization script
# This will link the project and run all migrations

PROJECT_REF="xougqdomkoisrxdnagcj"

echo "🚀 Initializing Supabase for Directors project..."
echo ""

# Check if Supabase CLI is installed
command -v supabase >/dev/null 2>&1 || { 
  echo "❌ Supabase CLI not found. Installing..."
  npm install -g supabase
}

# Check if already linked
if [ -f "supabase/.temp/project-ref" ]; then
  CURRENT_REF=$(cat supabase/.temp/project-ref)
  if [ "$CURRENT_REF" = "$PROJECT_REF" ]; then
    echo "✅ Already linked to project: $PROJECT_REF"
  else
    echo "⚠️  Linked to different project: $CURRENT_REF"
    echo "   Unlinking and re-linking to: $PROJECT_REF"
    supabase unlink || true
    supabase link --project-ref "$PROJECT_REF" || {
      echo "❌ Failed to link. You may need to provide database password."
      echo "   Run: supabase link --project-ref $PROJECT_REF"
      exit 1
    }
  fi
else
  echo "📦 Linking to Supabase project: $PROJECT_REF"
  supabase link --project-ref "$PROJECT_REF" || {
    echo "❌ Failed to link. You may need to provide database password."
    echo "   Run: supabase link --project-ref $PROJECT_REF"
    exit 1
  }
fi

echo ""
echo "🔄 Running database migrations..."
supabase db push

echo ""
echo "✅ Supabase initialization complete!"
echo ""
echo "📋 Next steps:"
echo "1. Get your credentials:"
echo "   supabase status"
echo ""
echo "2. Set up authentication in Supabase Dashboard:"
echo "   - Go to: https://supabase.com/dashboard/project/$PROJECT_REF/auth/providers"
echo "   - Enable Email provider"
echo ""
echo "3. Create the custodian user:"
echo "   supabase auth users create custodian@inquiry.institute --password 'your-password'"
echo ""
echo "4. Get API credentials:"
echo "   - Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
echo "   - Copy URL and anon key to config.js or .env"
