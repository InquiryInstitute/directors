-- Create colleges table (works with existing TEXT id schema)
-- The existing colleges table uses TEXT for id, so we'll work with that

-- Ensure colleges table has required columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'colleges') THEN
    -- Create new table with TEXT id (to match existing schema)
    CREATE TABLE colleges (
      id TEXT PRIMARY KEY,
      code VARCHAR(10) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  ELSE
    -- Table exists - add missing columns if needed
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'colleges' AND column_name = 'created_at') THEN
      ALTER TABLE colleges ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'colleges' AND column_name = 'updated_at') THEN
      ALTER TABLE colleges ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- Create board_of_directors table with TEXT college_id to match colleges.id
CREATE TABLE IF NOT EXISTS board_of_directors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id TEXT REFERENCES colleges(id) ON DELETE SET NULL,
  position_type VARCHAR(50) NOT NULL CHECK (position_type IN ('college', 'heretic')),
  director_name VARCHAR(255) NOT NULL,
  rationale TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(college_id, position_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_board_college_id ON board_of_directors(college_id);
CREATE INDEX IF NOT EXISTS idx_board_position_type ON board_of_directors(position_type);

-- Enable Row Level Security (RLS)
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_of_directors ENABLE ROW LEVEL SECURITY;

-- Create policies (drop first if they exist)
DROP POLICY IF EXISTS "Allow public read access on colleges" ON colleges;
CREATE POLICY "Allow public read access on colleges" ON colleges
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on board_of_directors" ON board_of_directors;
CREATE POLICY "Allow public read access on board_of_directors" ON board_of_directors
  FOR SELECT USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_colleges_updated_at ON colleges;
CREATE TRIGGER update_colleges_updated_at
  BEFORE UPDATE ON colleges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_board_of_directors_updated_at ON board_of_directors;
CREATE TRIGGER update_board_of_directors_updated_at
  BEFORE UPDATE ON board_of_directors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
