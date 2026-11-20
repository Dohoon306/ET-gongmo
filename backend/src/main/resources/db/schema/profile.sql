SET @et_d_schema_sql = IF((
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name IN ('room', 'users') AND table_type = 'BASE TABLE'
) = 2, 'CREATE TABLE IF NOT EXISTS evaluation (
  id            BIGINT        NOT NULL AUTO_INCREMENT,
  room_id       BIGINT        NOT NULL,
  evaluator_id  BIGINT        NOT NULL,
  target_id     BIGINT        NOT NULL,
  score         TINYINT       NOT NULL,
  comment       VARCHAR(200)  NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_eval_once (room_id, evaluator_id, target_id),
  KEY idx_eval_target (target_id),
  CONSTRAINT fk_eval_room      FOREIGN KEY (room_id)      REFERENCES room (id) ON DELETE CASCADE,
  CONSTRAINT fk_eval_evaluator FOREIGN KEY (evaluator_id) REFERENCES users (id),
  CONSTRAINT fk_eval_target    FOREIGN KEY (target_id)    REFERENCES users (id),
  CONSTRAINT ck_eval_score CHECK (score BETWEEN 1 AND 5),
  CONSTRAINT ck_eval_not_self CHECK (evaluator_id <> target_id)
)', 'SELECT 1');
PREPARE et_d_schema FROM @et_d_schema_sql;
EXECUTE et_d_schema;
DEALLOCATE PREPARE et_d_schema;
