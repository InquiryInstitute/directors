-- Create action items table
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  assigned_to VARCHAR(255), -- Director name or member email
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_action_items_issue_id ON action_items(issue_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_assigned_to ON action_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(due_date);

-- Enable Row Level Security
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for action_items
CREATE POLICY "Allow members to read action items" ON action_items
  FOR SELECT USING (is_member());

CREATE POLICY "Allow members to create action items" ON action_items
  FOR INSERT WITH CHECK (is_member());

CREATE POLICY "Allow members to update action items" ON action_items
  FOR UPDATE USING (is_member());

CREATE POLICY "Allow members to delete action items" ON action_items
  FOR DELETE USING (is_member());

-- Create trigger for updated_at
CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add vote tracking enhancements to votes table
ALTER TABLE votes 
  ADD COLUMN IF NOT EXISTS vote_weight INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN votes.vote_weight IS 'Weight of the vote (default 1, can be adjusted for special circumstances)';
COMMENT ON COLUMN votes.notes IS 'Additional notes or context for the vote';

-- Create view for vote summaries with details
CREATE OR REPLACE VIEW vote_summary_view AS
SELECT 
  i.id as issue_id,
  i.title as issue_title,
  v.vote_type,
  COUNT(*) as vote_count,
  SUM(v.vote_weight) as weighted_votes,
  ARRAY_AGG(v.director_name ORDER BY v.director_name) as directors,
  ARRAY_AGG(v.rationale ORDER BY v.director_name) FILTER (WHERE v.rationale IS NOT NULL) as rationales
FROM issues i
LEFT JOIN votes v ON i.id = v.issue_id
GROUP BY i.id, i.title, v.vote_type
ORDER BY i.id, v.vote_type;

GRANT SELECT ON vote_summary_view TO authenticated;

-- Function to get detailed vote summary for an issue
CREATE OR REPLACE FUNCTION get_detailed_vote_summary(issue_uuid UUID)
RETURNS TABLE (
  vote_type VARCHAR,
  vote_count BIGINT,
  weighted_votes NUMERIC,
  directors TEXT[],
  rationales TEXT[],
  total_votes BIGINT,
  total_weighted NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.vote_type,
    COUNT(*)::BIGINT as vote_count,
    SUM(v.vote_weight)::NUMERIC as weighted_votes,
    ARRAY_AGG(v.director_name ORDER BY v.director_name) as directors,
    ARRAY_AGG(v.rationale ORDER BY v.director_name) FILTER (WHERE v.rationale IS NOT NULL) as rationales,
    (SELECT COUNT(*)::BIGINT FROM votes WHERE issue_id = issue_uuid) as total_votes,
    (SELECT SUM(vote_weight)::NUMERIC FROM votes WHERE issue_id = issue_uuid) as total_weighted
  FROM votes v
  WHERE v.issue_id = issue_uuid
  GROUP BY v.vote_type
  ORDER BY v.vote_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_detailed_vote_summary(UUID) TO authenticated;
