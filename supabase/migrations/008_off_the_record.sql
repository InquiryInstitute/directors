-- Add off_the_record column to chat_messages
ALTER TABLE chat_messages 
  ADD COLUMN IF NOT EXISTS off_the_record BOOLEAN DEFAULT false;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_chat_messages_off_the_record ON chat_messages(off_the_record);

-- Update RLS policies if needed (no change needed, existing policies cover this)
