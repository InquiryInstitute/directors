#!/bin/bash
set -e

echo "🚀 Setting up Directors repository..."

# Check for required CLIs
command -v supabase >/dev/null 2>&1 || { echo "❌ Supabase CLI not found. Install with: npm install -g supabase"; exit 1; }
command -v gh >/dev/null 2>&1 || { echo "❌ GitHub CLI not found. Install with: brew install gh"; exit 1; }

# Setup Supabase
echo "📦 Setting up Supabase..."
if [ -f "scripts/setup-supabase.sh" ]; then
  chmod +x scripts/setup-supabase.sh
  ./scripts/setup-supabase.sh
else
  echo "⚠️  Supabase setup script not found, running manual setup..."
  if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "Please run: supabase link --project-ref your-project-ref"
    read -p "Press enter after linking your Supabase project..."
  fi
  supabase db push
fi

# Get Supabase credentials
echo "🔑 Fetching Supabase credentials..."
SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}' || echo "")
SUPABASE_ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}' || echo "")

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "⚠️  Could not auto-detect Supabase credentials. Please set them manually:"
  echo "   Get them from: https://app.supabase.com/project/_/settings/api"
fi

# Setup GitHub repository
echo "🐙 Setting up GitHub repository..."
if ! gh repo view InquiryInstitute/directors >/dev/null 2>&1; then
  echo "Creating repository..."
  gh repo create InquiryInstitute/directors --public --source=. --remote=origin --push
else
  echo "Repository already exists. Skipping creation."
fi

# Enable GitHub Pages
echo "📄 Enabling GitHub Pages..."
gh api repos/InquiryInstitute/directors/pages \
  --method POST \
  --field source='{"branch":"main","path":"/root"}' \
  || echo "GitHub Pages may already be enabled or you may need to enable it manually"

# Set up GitHub Secrets for Supabase (if credentials found)
if [ ! -z "$SUPABASE_URL" ] && [ ! -z "$SUPABASE_ANON_KEY" ]; then
  echo "🔐 Setting GitHub Secrets..."
  gh secret set SUPABASE_URL --body "$SUPABASE_URL" --repo InquiryInstitute/directors || true
  gh secret set SUPABASE_ANON_KEY --body "$SUPABASE_ANON_KEY" --repo InquiryInstitute/directors || true
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure DNS for directors.inquiry.institute to point to GitHub Pages"
echo "2. Update .env file with Supabase credentials if not auto-detected"
echo "3. Test the site locally: npm run dev"
