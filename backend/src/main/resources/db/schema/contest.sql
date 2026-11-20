CREATE TABLE IF NOT EXISTS contest (
  id               BIGINT        NOT NULL AUTO_INCREMENT,
  gongmoa_id       BIGINT        NOT NULL,
  title            VARCHAR(255)  NOT NULL,
  type             VARCHAR(20)   NULL,
  host             VARCHAR(255)  NULL,
  start_date       DATE          NULL,
  end_date         DATE          NULL,
  target           VARCHAR(100)  NULL,
  prize            VARCHAR(100)  NULL,
  benefit          VARCHAR(100)  NULL,
  period_mismatch  BOOLEAN       NOT NULL DEFAULT FALSE,
  gongmoa_url      VARCHAR(500)  NOT NULL,
  source_url       VARCHAR(500)  NULL,
  raw_text         TEXT          NULL,
  fetched_at       DATETIME      NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_contest_gongmoa (gongmoa_id),
  KEY idx_contest_end_date (end_date)
);

CREATE TABLE IF NOT EXISTS contest_category (
  contest_id   BIGINT NOT NULL,
  category_id  BIGINT NOT NULL,
  PRIMARY KEY (contest_id, category_id),
  CONSTRAINT fk_cc_contest  FOREIGN KEY (contest_id)  REFERENCES contest (id)  ON DELETE CASCADE,
  CONSTRAINT fk_cc_category FOREIGN KEY (category_id) REFERENCES category (id)
);
