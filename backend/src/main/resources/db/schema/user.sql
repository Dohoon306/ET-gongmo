CREATE TABLE IF NOT EXISTS category (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  axis        VARCHAR(20)  NOT NULL,
  code        VARCHAR(40)  NOT NULL,
  name        VARCHAR(40)  NOT NULL,
  sort_order  INT          NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_category_code (code)
);

CREATE TABLE IF NOT EXISTS users (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  name        VARCHAR(30)  NOT NULL,
  intro       TEXT         NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS user_category (
  user_id      BIGINT NOT NULL,
  category_id  BIGINT NOT NULL,
  PRIMARY KEY (user_id, category_id),
  CONSTRAINT fk_uc_user     FOREIGN KEY (user_id)     REFERENCES users (id)    ON DELETE CASCADE,
  CONSTRAINT fk_uc_category FOREIGN KEY (category_id) REFERENCES category (id)
);
