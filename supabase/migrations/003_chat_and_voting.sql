-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create issues table for voting
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  created_by VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  director_name VARCHAR(255) NOT NULL,
  vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('yes', 'no', 'abstain')),
  rationale TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(issue_id, director_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_issue_id ON votes(issue_id);
CREATE INDEX IF NOT EXISTS idx_votes_director_name ON votes(director_name);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
-- Only authenticated users can read/write
CREATE POLICY "Allow authenticated users to read chat messages" ON chat_messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for issues
CREATE POLICY "Allow authenticated users to read issues" ON issues
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to create issues" ON issues
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update issues" ON issues
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for votes
CREATE POLICY "Allow authenticated users to read votes" ON votes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert votes" ON votes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update votes" ON votes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create triggers for updated_at
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at
  BEFORE UPDATE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get vote summary for an issue
CREATE OR REPLACE FUNCTION get_issue_vote_summary(issue_uuid UUID)
RETURNS TABLE (
  vote_type VARCHAR,
  count BIGINT,
  directors TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.vote_type,
    COUNT(*)::BIGINT as count,
    ARRAY_AGG(v.director_name ORDER BY v.director_name) as directors
  FROM votes v
  WHERE v.issue_id = issue_uuid
  GROUP BY v.vote_type
  ORDER BY v.vote_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
