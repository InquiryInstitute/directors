#!/bin/bash
set -e

# Quick script to link Supabase project
# Usage: ./scripts/link-supabase.sh [access-token]

PROJECT_REF="xougqdomkoisrxdnagcj"

echo "🔗 Linking to Supabase project: $PROJECT_REF"

if [ -n "$1" ]; then
  # Access token provided as argument
  supabase link --project-ref "$PROJECT_REF" --password "$1"
elif [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
  # Access token from environment
  supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_ACCESS_TOKEN"
else
  # Try without password (will prompt if needed)
  echo "Attempting to link (may prompt for database password)..."
  supabase link --project-ref "$PROJECT_REF"
fi

echo "✅ Linked successfully!"
echo ""
echo "Next steps:"
echo "1. Run migrations: supabase db push"
echo "2. Get credentials: supabase status"
