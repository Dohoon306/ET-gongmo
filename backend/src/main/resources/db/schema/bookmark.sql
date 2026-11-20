SET @et_d_schema_sql = IF((
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name IN ('users', 'contest') AND table_type = 'BASE TABLE'
) = 2, 'CREATE TABLE IF NOT EXISTS bookmark (
  user_id     BIGINT    NOT NULL,
  contest_id  BIGINT    NOT NULL,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, contest_id),
  KEY idx_bookmark_contest (contest_id),
  CONSTRAINT fk_bookmark_user    FOREIGN KEY (user_id)    REFERENCES users (id)   ON DELETE CASCADE,
  CONSTRAINT fk_bookmark_contest FOREIGN KEY (contest_id) REFERENCES contest (id) ON DELETE CASCADE
)', 'SELECT 1');
PREPARE et_d_schema FROM @et_d_schema_sql;
EXECUTE et_d_schema;
DEALLOCATE PREPARE et_d_schema;
