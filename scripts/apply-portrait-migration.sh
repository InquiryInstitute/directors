#!/bin/bash
# Script to apply the portrait migration directly via Supabase SQL editor
# This bypasses migration conflicts

set -e

echo "🎨 Applying portrait migration..."

MIGRATION_SQL=$(cat << 'SQL'
-- Add portrait URL column to board_of_directors (if not exists)
ALTER TABLE board_of_directors 
  ADD COLUMN IF NOT EXISTS portrait_url TEXT;

-- Create index for portrait URLs
CREATE INDEX IF NOT EXISTS idx_board_portrait_url ON board_of_directors(portrait_url) WHERE portrait_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN board_of_directors.portrait_url IS 'URL to the director''s portrait image';
SQL
)

echo "📋 SQL to run in Supabase:"
echo "=========================="
echo "$MIGRATION_SQL"
echo ""
echo "Go to: https://supabase.com/dashboard/project/xougqdomkoisrxdnagcj/sql"
echo "Copy and paste the SQL above, then run it."
