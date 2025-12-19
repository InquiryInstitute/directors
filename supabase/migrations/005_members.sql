-- Create members table for users who can interact with the board
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  member_class VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (member_class IN ('custodian', 'member', 'observer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_class ON members(member_class);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for members
-- Public can read members (for display purposes)
CREATE POLICY "Allow public read access on members" ON members
  FOR SELECT USING (true);

-- Only authenticated users can see their own member record
CREATE POLICY "Allow users to see their own member record" ON members
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Function to check if user is a member (any class)
CREATE OR REPLACE FUNCTION is_member()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM members 
    WHERE email = auth.jwt() ->> 'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get member class
CREATE OR REPLACE FUNCTION get_member_class()
RETURNS VARCHAR AS $$
BEGIN
  RETURN (
    SELECT member_class FROM members 
    WHERE email = auth.jwt() ->> 'email'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_member() TO authenticated;
GRANT EXECUTE ON FUNCTION get_member_class() TO authenticated;

-- Update chat_messages to reference members
ALTER TABLE chat_messages 
  ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_member_id ON chat_messages(member_id);

-- Update RLS policies for chat to allow members
DROP POLICY IF EXISTS "Allow authenticated users to read chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow authenticated users to insert chat messages" ON chat_messages;

-- Allow members to read chat messages
CREATE POLICY "Allow members to read chat messages" ON chat_messages
  FOR SELECT USING (is_member());

-- Allow members to insert chat messages
CREATE POLICY "Allow members to insert chat messages" ON chat_messages
  FOR INSERT WITH CHECK (is_member());

-- Update issues policies to allow members
DROP POLICY IF EXISTS "Allow authenticated users to read issues" ON issues;
DROP POLICY IF EXISTS "Allow authenticated users to create issues" ON issues;
DROP POLICY IF EXISTS "Allow authenticated users to update issues" ON issues;

CREATE POLICY "Allow members to read issues" ON issues
  FOR SELECT USING (is_member());

CREATE POLICY "Allow members to create issues" ON issues
  FOR INSERT WITH CHECK (is_member());

CREATE POLICY "Allow members to update issues" ON issues
  FOR UPDATE USING (is_member());

-- Update votes policies to allow members
DROP POLICY IF EXISTS "Allow authenticated users to read votes" ON votes;
DROP POLICY IF EXISTS "Allow authenticated users to insert votes" ON votes;
DROP POLICY IF EXISTS "Allow authenticated users to update votes" ON votes;

CREATE POLICY "Allow members to read votes" ON votes
  FOR SELECT USING (is_member());

CREATE POLICY "Allow members to insert votes" ON votes
  FOR INSERT WITH CHECK (is_member());

CREATE POLICY "Allow members to update votes" ON votes
  FOR UPDATE USING (is_member());

-- Insert initial custodian member
INSERT INTO members (email, name, member_class)
VALUES ('custodian@inquiry.institute', 'Custodian', 'custodian')
ON CONFLICT (email) DO UPDATE 
SET member_class = 'custodian', name = 'Custodian';
