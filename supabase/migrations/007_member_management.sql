-- Function to add a new member (custodian only)
CREATE OR REPLACE FUNCTION add_member(
  member_email VARCHAR,
  member_name VARCHAR,
  member_class VARCHAR DEFAULT 'member'
)
RETURNS UUID AS $$
DECLARE
  new_member_id UUID;
BEGIN
  -- Check if user is custodian
  IF get_member_class() != 'custodian' THEN
    RAISE EXCEPTION 'Only custodian can add members';
  END IF;

  -- Validate member class
  IF member_class NOT IN ('custodian', 'member', 'observer') THEN
    RAISE EXCEPTION 'Invalid member class: %', member_class;
  END IF;

  -- Insert member
  INSERT INTO members (email, name, member_class)
  VALUES (member_email, member_name, member_class)
  ON CONFLICT (email) DO UPDATE
  SET name = EXCLUDED.name,
      member_class = EXCLUDED.member_class,
      updated_at = NOW()
  RETURNING id INTO new_member_id;

  RETURN new_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_member(VARCHAR, VARCHAR, VARCHAR) TO authenticated;

-- Function to update member class (custodian only)
CREATE OR REPLACE FUNCTION update_member_class(
  member_email VARCHAR,
  new_class VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is custodian
  IF get_member_class() != 'custodian' THEN
    RAISE EXCEPTION 'Only custodian can update member classes';
  END IF;

  -- Validate member class
  IF new_class NOT IN ('custodian', 'member', 'observer') THEN
    RAISE EXCEPTION 'Invalid member class: %', new_class;
  END IF;

  -- Update member
  UPDATE members
  SET member_class = new_class,
      updated_at = NOW()
  WHERE email = member_email;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_member_class(VARCHAR, VARCHAR) TO authenticated;

-- Function to list all members (custodian only)
CREATE OR REPLACE FUNCTION list_members()
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  name VARCHAR,
  member_class VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if user is custodian
  IF get_member_class() != 'custodian' THEN
    RAISE EXCEPTION 'Only custodian can list members';
  END IF;

  RETURN QUERY
  SELECT m.id, m.email, m.name, m.member_class, m.created_at
  FROM members m
  ORDER BY m.member_class, m.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION list_members() TO authenticated;
