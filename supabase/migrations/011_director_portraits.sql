-- Add portrait URL column to board_of_directors (if not exists)
ALTER TABLE board_of_directors 
  ADD COLUMN IF NOT EXISTS portrait_url TEXT;

-- Create index for portrait URLs
CREATE INDEX IF NOT EXISTS idx_board_portrait_url ON board_of_directors(portrait_url) WHERE portrait_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN board_of_directors.portrait_url IS 'URL to the director''s portrait image';

-- Add Wikipedia portrait URLs for directors
-- Using Wikipedia's image URLs (these are stable and publicly accessible)

UPDATE board_of_directors
SET portrait_url = CASE director_name
  -- Alan Turing (AINS)
  WHEN 'Alan Turing' THEN 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Alan_Turing_Aged_16.jpg'
  
  -- Katsushika Ōi (ARTS)
  WHEN 'Katsushika Ōi' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Katsushika_%C5%8Ci.jpg/800px-Katsushika_%C5%8Ci.jpg'
  
  -- Leonardo da Vinci (CRAF)
  WHEN 'Leonardo da Vinci' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Leonardo_self.jpg/800px-Leonardo_self.jpg'
  
  -- Confucius (ELAG)
  WHEN 'Confucius' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Kong_Qiu.jpg/800px-Kong_Qiu.jpg'
  
  -- Ibn Sina / Avicenna (HEAL)
  WHEN 'Ibn Sina (Avicenna)' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Avicenna_Portrait_on_Silver_Vase_-_Museum_at_BuAli_Sina_%28Avicenna%29_Mausoleum_-_Hamadan_-_Western_Iran_%2813124867165%29.jpg/800px-Avicenna_Portrait_on_Silver_Vase_-_Museum_at_BuAli_Sina_%28Avicenna%29_Mausoleum_-_Hamadan_-_Western_Iran_%2813124867165%29.jpg'
  
  -- Mary Shelley (HUMN)
  WHEN 'Mary Shelley' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Mary_Wollstonecraft_Shelley_Rothwell.jpg/800px-Mary_Wollstonecraft_Shelley_Rothwell.jpg'
  
  -- Al-Khwarizmi (MATH)
  WHEN 'Al-Khwarizmi' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Al-Khwarizmi_portrait.jpg/800px-Al-Khwarizmi_portrait.jpg'
  
  -- Ibn al-Haytham (META)
  WHEN 'Ibn al-Haytham' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Ibn_al-Haytham.png/800px-Ibn_al-Haytham.png'
  
  -- Maria Sibylla Merian (NATP)
  WHEN 'Maria Sibylla Merian' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Maria_Sibylla_Merian_1647-1717.jpg/800px-Maria_Sibylla_Merian_1647-1717.jpg'
  
  -- Zhuangzi (SOCI)
  WHEN 'Zhuangzi' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Zhuangzi.jpg/800px-Zhuangzi.jpg'
  
  ELSE portrait_url
END
WHERE director_name IN (
  'Alan Turing',
  'Katsushika Ōi',
  'Leonardo da Vinci',
  'Confucius',
  'Ibn Sina (Avicenna)',
  'Mary Shelley',
  'Al-Khwarizmi',
  'Ibn al-Haytham',
  'Maria Sibylla Merian',
  'Zhuangzi'
);
