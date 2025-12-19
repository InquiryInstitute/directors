-- Add platform statement column to board_of_directors
ALTER TABLE board_of_directors 
  ADD COLUMN IF NOT EXISTS platform_statement TEXT;

-- Create index for platform statements
CREATE INDEX IF NOT EXISTS idx_board_platform_statement ON board_of_directors(platform_statement) WHERE platform_statement IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN board_of_directors.platform_statement IS 'The director''s platform statement that guides their decision-making and representation of their college';
