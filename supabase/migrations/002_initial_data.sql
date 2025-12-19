-- Insert initial colleges (with explicit id for TEXT type)
INSERT INTO colleges (id, code, name, description) VALUES
  (gen_random_uuid()::text, 'AINS', 'Applied Intelligent Systems', 'Computation, AI foundations, machine intelligence'),
  (gen_random_uuid()::text, 'ARTS', 'Arts & Aesthetics', 'Visual arts, perception, technique, embodied craft'),
  (gen_random_uuid()::text, 'CRAF', 'Craft & Making', 'Engineering, invention, drawing, mechanics'),
  (gen_random_uuid()::text, 'ELAG', 'Ethics, Law & Governance', 'Moral philosophy, social order, governance'),
  (gen_random_uuid()::text, 'HEAL', 'Health & Life Sciences', 'Medicine, physiology, holistic health'),
  (gen_random_uuid()::text, 'HUMN', 'Humanities', 'Literature, myth, responsibility of creation'),
  (gen_random_uuid()::text, 'MATH', 'Mathematics & Formal Systems', 'Algebra, formal abstraction, symbolic reasoning'),
  (gen_random_uuid()::text, 'META', 'Epistemology & Method', 'Scientific method, optics, experimental rigor'),
  (gen_random_uuid()::text, 'NATP', 'Natural Philosophy', 'Ecology, observation, natural systems'),
  (gen_random_uuid()::text, 'SOCI', 'Social & Cultural Systems', 'Social relativism, perspective, non-coercive order')
ON CONFLICT (code) DO NOTHING;

-- Insert initial board of directors
INSERT INTO board_of_directors (college_id, position_type, director_name, rationale)
SELECT 
  c.id,
  'college'::VARCHAR,
  CASE c.code
    WHEN 'AINS' THEN 'Alan Turing'
    WHEN 'ARTS' THEN 'Katsushika Ōi'
    WHEN 'CRAF' THEN 'Leonardo da Vinci'
    WHEN 'ELAG' THEN 'Confucius'
    WHEN 'HEAL' THEN 'Ibn Sina (Avicenna)'
    WHEN 'HUMN' THEN 'Mary Shelley'
    WHEN 'MATH' THEN 'Al-Khwarizmi'
    WHEN 'META' THEN 'Ibn al-Haytham'
    WHEN 'NATP' THEN 'Maria Sibylla Merian'
    WHEN 'SOCI' THEN 'Zhuangzi'
  END,
  CASE c.code
    WHEN 'AINS' THEN 'Computation, AI foundations, machine intelligence'
    WHEN 'ARTS' THEN 'Visual arts, perception, technique, embodied craft'
    WHEN 'CRAF' THEN 'Engineering, invention, drawing, mechanics'
    WHEN 'ELAG' THEN 'Moral philosophy, social order, governance'
    WHEN 'HEAL' THEN 'Medicine, physiology, holistic health'
    WHEN 'HUMN' THEN 'Literature, myth, responsibility of creation'
    WHEN 'MATH' THEN 'Algebra, formal abstraction, symbolic reasoning'
    WHEN 'META' THEN 'Scientific method, optics, experimental rigor'
    WHEN 'NATP' THEN 'Ecology, observation, natural systems'
    WHEN 'SOCI' THEN 'Social relativism, perspective, non-coercive order'
  END
FROM colleges c
WHERE c.code IN ('AINS', 'ARTS', 'CRAF', 'ELAG', 'HEAL', 'HUMN', 'MATH', 'META', 'NATP', 'SOCI')
ON CONFLICT (college_id, position_type) DO NOTHING;

-- Insert heretic position (no college_id)
INSERT INTO board_of_directors (college_id, position_type, director_name, rationale)
VALUES (NULL, 'heretic', '', '')
ON CONFLICT (college_id, position_type) DO NOTHING;
