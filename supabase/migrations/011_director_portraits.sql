-- Add portrait URL column to board_of_directors
ALTER TABLE board_of_directors 
  ADD COLUMN IF NOT EXISTS portrait_url TEXT;

-- Create index for portrait URLs
CREATE INDEX IF NOT EXISTS idx_board_portrait_url ON board_of_directors(portrait_url) WHERE portrait_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN board_of_directors.portrait_url IS 'URL to the director''s portrait image';
