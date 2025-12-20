-- Add excitement statement column to board_of_directors
ALTER TABLE board_of_directors 
  ADD COLUMN IF NOT EXISTS excitement_statement TEXT;

-- Create index for statements
CREATE INDEX IF NOT EXISTS idx_board_excitement_statement ON board_of_directors(excitement_statement) WHERE excitement_statement IS NOT NULL;

-- Add comment
COMMENT ON COLUMN board_of_directors.excitement_statement IS 'Director''s statement about why they are excited about Inquiry Institute';
