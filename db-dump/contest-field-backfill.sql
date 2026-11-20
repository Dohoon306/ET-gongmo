INSERT IGNORE INTO contest_category (contest_id, category_id)
SELECT contest.id, category.id
FROM contest
JOIN (
  SELECT 845218 AS gongmoa_id, 'it' AS code
  UNION ALL SELECT 845218, 'startup'
  UNION ALL SELECT 845217, 'supporters'
  UNION ALL SELECT 844813, 'supporters'
  UNION ALL SELECT 844798, 'supporters'
  UNION ALL SELECT 844794, 'video'
  UNION ALL SELECT 844794, 'marketing'
  UNION ALL SELECT 844795, 'it'
  UNION ALL SELECT 844795, 'startup'
  UNION ALL SELECT 832038, 'idea'
  UNION ALL SELECT 832038, 'marketing'
  UNION ALL SELECT 831659, 'supporters'
  UNION ALL SELECT 831658, 'it'
  UNION ALL SELECT 831656, 'etc'
  UNION ALL SELECT 831647, 'etc'
  UNION ALL SELECT 831648, 'etc'
  UNION ALL SELECT 831629, 'startup'
  UNION ALL SELECT 831630, 'supporters'
  UNION ALL SELECT 831631, 'volunteer'
  UNION ALL SELECT 831632, 'marketing'
  UNION ALL SELECT 831606, 'supporters'
  UNION ALL SELECT 831606, 'volunteer'
  UNION ALL SELECT 831580, 'volunteer'
  UNION ALL SELECT 831582, 'etc'
  UNION ALL SELECT 831166, 'it'
  UNION ALL SELECT 818082, 'it'
  UNION ALL SELECT 818073, 'supporters'
  UNION ALL SELECT 818057, 'it'
  UNION ALL SELECT 818057, 'startup'
  UNION ALL SELECT 818058, 'video'
  UNION ALL SELECT 818059, 'design'
  UNION ALL SELECT 818059, 'it'
  UNION ALL SELECT 818060, 'it'
  UNION ALL SELECT 818061, 'it'
  UNION ALL SELECT 818033, 'etc'
  UNION ALL SELECT 818022, 'marketing'
  UNION ALL SELECT 818023, 'it'
  UNION ALL SELECT 818024, 'startup'
) AS backfill ON backfill.gongmoa_id = contest.gongmoa_id
JOIN category ON category.axis = 'FIELD' AND category.code = backfill.code
LEFT JOIN (
  SELECT DISTINCT tags.contest_id
  FROM contest_category AS tags
  JOIN category AS fields ON fields.id = tags.category_id AND fields.axis = 'FIELD'
) AS existing_fields ON existing_fields.contest_id = contest.id
WHERE existing_fields.contest_id IS NULL;
