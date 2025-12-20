-- Check if portrait_url column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'board_of_directors' 
AND column_name = 'portrait_url';

-- If the above returns no rows, run this:
-- ALTER TABLE board_of_directors ADD COLUMN IF NOT EXISTS portrait_url TEXT;

-- Check current portrait URLs
SELECT director_name, portrait_url, colleges(code) as college_code
FROM board_of_directors
LEFT JOIN colleges ON board_of_directors.college_id = colleges.id
ORDER BY director_name;
