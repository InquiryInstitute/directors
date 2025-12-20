-- Add 'alpha' member class and update permissions
-- Allow anyone to view board, but only alpha members can post off-the-record

-- Update members table to include 'alpha' class
ALTER TABLE members 
  DROP CONSTRAINT IF EXISTS members_member_class_check;

ALTER TABLE members 
  ADD CONSTRAINT members_member_class_check 
  CHECK (member_class IN ('custodian', 'member', 'observer', 'alpha'));

-- Update member management functions to allow 'alpha'
CREATE OR REPLACE FUNCTION add_member(
  member_email VARCHAR,
  member_name VARCHAR DEFAULT NULL,
  member_class VARCHAR DEFAULT 'member'
)
RETURNS UUID AS $$
DECLARE
  member_id UUID;
BEGIN
  -- Only custodians can add members
  IF get_member_class() != 'custodian' THEN
    RAISE EXCEPTION 'Only custodians can add members';
  END IF;
  
  -- Validate member class
  IF member_class NOT IN ('custodian', 'member', 'observer', 'alpha') THEN
    RAISE EXCEPTION 'Invalid member class: %', member_class;
  END IF;
  
  -- Insert or update member
  INSERT INTO members (email, name, member_class)
  VALUES (member_email, member_name, member_class)
  ON CONFLICT (email) DO UPDATE 
    SET name = EXCLUDED.name,
        member_class = EXCLUDED.member_class,
        updated_at = NOW()
  RETURNING id INTO member_id;
  
  RETURN member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update chat_messages RLS to allow public read access
DROP POLICY IF EXISTS "Allow members to read chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow public read access on chat messages" ON chat_messages;

-- Allow anyone to read chat messages (public board)
CREATE POLICY "Allow public read access on chat messages" ON chat_messages
  FOR SELECT USING (true);

-- Update insert policy to allow authenticated members
DROP POLICY IF EXISTS "Allow members to insert chat messages" ON chat_messages;

CREATE POLICY "Allow members to insert chat messages" ON chat_messages
  FOR INSERT WITH CHECK (is_member());

-- Update issues RLS to allow public read access
DROP POLICY IF EXISTS "Allow members to read issues" ON issues;
DROP POLICY IF EXISTS "Allow public read access on issues" ON issues;

CREATE POLICY "Allow public read access on issues" ON issues
  FOR SELECT USING (true);

-- Update votes RLS to allow public read access
DROP POLICY IF EXISTS "Allow members to read votes" ON votes;
DROP POLICY IF EXISTS "Allow public read access on votes" ON votes;

CREATE POLICY "Allow public read access on votes" ON votes
  FOR SELECT USING (true);

-- Function to check if user can post off-the-record (alpha members only)
CREATE OR REPLACE FUNCTION can_post_off_record()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM members 
    WHERE email = auth.jwt() ->> 'email'
    AND member_class = 'alpha'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_post_off_record() TO authenticated;

-- Add constraint: only alpha members can post off-the-record messages
-- This will be enforced in the application layer, but we add a check constraint
ALTER TABLE chat_messages
  ADD CONSTRAINT check_off_record_alpha 
  CHECK (
    off_the_record = false OR 
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = chat_messages.member_id
      AND m.member_class = 'alpha'
    )
  );
