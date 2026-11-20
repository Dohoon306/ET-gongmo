CREATE TABLE IF NOT EXISTS admin_account (
  user_id  BIGINT NOT NULL,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_suspension (
  user_id       BIGINT        NOT NULL,
  reason        VARCHAR(200)  NULL,
  suspended_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_suspension_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_report (
  id           BIGINT         NOT NULL AUTO_INCREMENT,
  reporter_id  BIGINT         NOT NULL,
  target_id    BIGINT         NOT NULL,
  reasons      VARCHAR(200)   NOT NULL,
  detail       VARCHAR(1000)  NULL,
  source       VARCHAR(20)    NOT NULL DEFAULT 'PROFILE',
  room_id      BIGINT         NULL,
  created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_report_target (target_id),
  CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_report_target   FOREIGN KEY (target_id)   REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_report_room     FOREIGN KEY (room_id)     REFERENCES room (id)  ON DELETE SET NULL,
  CONSTRAINT ck_report_source CHECK (source IN ('PROFILE', 'TEAM_CHAT', 'DIRECT')),
  CONSTRAINT ck_report_not_self CHECK (reporter_id <> target_id)
);

CREATE TABLE IF NOT EXISTS user_report_message (
  id           BIGINT         NOT NULL AUTO_INCREMENT,
  report_id    BIGINT         NOT NULL,
  sender_id    BIGINT         NOT NULL,
  sender_name  VARCHAR(30)    NOT NULL,
  content      VARCHAR(1000)  NOT NULL,
  sent_at      DATETIME       NOT NULL,
  PRIMARY KEY (id),
  KEY idx_report_message (report_id, id),
  CONSTRAINT fk_report_message FOREIGN KEY (report_id) REFERENCES user_report (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evaluation_appeal (
  id             BIGINT         NOT NULL AUTO_INCREMENT,
  evaluation_id  BIGINT         NOT NULL,
  room_id        BIGINT         NOT NULL,
  evaluator_id   BIGINT         NOT NULL,
  target_id      BIGINT         NOT NULL,
  score          TINYINT        NOT NULL,
  comment        VARCHAR(200)   NULL,
  reason         VARCHAR(1000)  NOT NULL,
  status         VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
  created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at     DATETIME       NULL,
  pending_flag   TINYINT GENERATED ALWAYS AS (CASE WHEN status = 'PENDING' THEN 1 END) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uk_appeal_one_pending (evaluation_id, pending_flag),
  KEY idx_appeal_target (target_id),
  CONSTRAINT ck_appeal_status CHECK (status IN ('PENDING', 'REMOVED', 'REJECTED'))
);
