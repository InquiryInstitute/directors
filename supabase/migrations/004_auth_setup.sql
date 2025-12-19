-- Enable email authentication
-- This is typically done via Supabase dashboard, but we document it here

-- Create a function to check if user is custodian
CREATE OR REPLACE FUNCTION is_custodian()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'email' = 'custodian@inquiry.institute';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_custodian() TO authenticated;

-- Update RLS policies to allow custodian special access
-- Note: These policies assume the custodian email is custodian@inquiry.institute

-- Allow custodian to see all chat messages (including historical)
-- Regular authenticated users can also see all messages (already set above)

-- Create a view for board members (directors) for easier querying
CREATE OR REPLACE VIEW board_members_view AS
SELECT 
  b.id,
  b.director_name,
  b.position_type,
  b.rationale,
  c.code as college_code,
  c.name as college_name
FROM board_of_directors b
LEFT JOIN colleges c ON b.college_id = c.id
ORDER BY 
  CASE WHEN b.position_type = 'heretic' THEN 1 ELSE 0 END,
  c.code;

-- Grant access to the view
GRANT SELECT ON board_members_view TO authenticated;
