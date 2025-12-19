#!/bin/bash
set -e

echo "🗄️  Setting up Supabase..."

command -v supabase >/dev/null 2>&1 || { 
  echo "❌ Supabase CLI not found. Installing..."
  npm install -g supabase
}

# Default project reference (can be overridden with environment variable)
DEFAULT_PROJECT_REF="xougqdomkoisrxdnagcj"

# Check if already linked
if [ -f "supabase/.temp/project-ref" ]; then
  echo "✅ Supabase project already linked"
  PROJECT_REF=$(cat supabase/.temp/project-ref)
  echo "   Project ref: $PROJECT_REF"
else
  echo "📦 Linking Supabase project..."
  if [ -z "$SUPABASE_PROJECT_REF" ]; then
    SUPABASE_PROJECT_REF="$DEFAULT_PROJECT_REF"
    echo "Using project ref: $SUPABASE_PROJECT_REF"
  fi
  
  if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "Please provide your Supabase access token"
    echo "Get it from: https://app.supabase.com/account/tokens"
    read -p "Enter access token: " SUPABASE_ACCESS_TOKEN
  fi
  
  if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "⚠️  No access token provided. Attempting to link without password..."
    supabase link --project-ref "$SUPABASE_PROJECT_REF" || {
      echo "❌ Linking failed. Please provide access token:"
      echo "   export SUPABASE_ACCESS_TOKEN=your-token"
      echo "   Then run this script again"
      exit 1
    }
  else
    supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_ACCESS_TOKEN"
  fi
fi

echo "🔄 Running database migrations..."
supabase db push

echo "🔑 Setting up authentication..."
echo "You'll need to:"
echo "1. Enable Email authentication in Supabase Dashboard > Authentication > Providers"
echo "2. Create the custodian user: custodian@inquiry.institute"
echo "   Run: supabase auth users create custodian@inquiry.institute --password 'your-password'"
echo "3. Or use the Supabase dashboard to create users"

echo ""
echo "📝 To create the custodian user via CLI:"
echo "   supabase auth users create custodian@inquiry.institute --password 'your-secure-password'"

echo ""
echo "✅ Supabase setup complete!"
echo ""
echo "Next steps:"
echo "1. Create users in Supabase Dashboard or via CLI"
echo "2. Add members to the members table (they'll be auto-created on first login if you set up a trigger)"
echo "3. Get your Supabase URL and anon key from: supabase status"
