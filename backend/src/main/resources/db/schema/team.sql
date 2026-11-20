CREATE TABLE IF NOT EXISTS room (
  id          BIGINT        NOT NULL AUTO_INCREMENT,
  contest_id  BIGINT        NULL,
  host_id     BIGINT        NOT NULL,
  title       VARCHAR(100)  NOT NULL,
  intro       TEXT          NULL,
  capacity    TINYINT       NOT NULL,
  status      VARCHAR(20)   NOT NULL DEFAULT 'RECRUITING',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_room_contest (contest_id, status),
  CONSTRAINT fk_room_contest FOREIGN KEY (contest_id) REFERENCES contest (id),
  CONSTRAINT fk_room_host    FOREIGN KEY (host_id)    REFERENCES users (id),
  CONSTRAINT ck_room_capacity CHECK (capacity BETWEEN 2 AND 10),
  CONSTRAINT ck_room_status   CHECK (status IN ('RECRUITING', 'FULL', 'CLOSED'))
);

CREATE TABLE IF NOT EXISTS room_category (
  room_id      BIGINT NOT NULL,
  category_id  BIGINT NOT NULL,
  PRIMARY KEY (room_id, category_id),
  CONSTRAINT fk_rc_room     FOREIGN KEY (room_id)     REFERENCES room (id)     ON DELETE CASCADE,
  CONSTRAINT fk_rc_category FOREIGN KEY (category_id) REFERENCES category (id)
);

CREATE TABLE IF NOT EXISTS room_member (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  room_id    BIGINT       NOT NULL,
  user_id    BIGINT       NOT NULL,
  role       VARCHAR(20)  NOT NULL,
  joined_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_member_room_user (room_id, user_id),
  KEY idx_member_user (user_id),
  CONSTRAINT fk_member_room FOREIGN KEY (room_id) REFERENCES room (id) ON DELETE CASCADE,
  CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT ck_member_role CHECK (role IN ('HOST', 'MEMBER'))
);

CREATE TABLE IF NOT EXISTS join_request (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  room_id       BIGINT       NOT NULL,
  user_id       BIGINT       NOT NULL,
  message       TEXT         NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at    DATETIME     NULL,
  pending_flag  TINYINT GENERATED ALWAYS AS (CASE WHEN status = 'PENDING' THEN 1 END) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uk_request_one_pending (room_id, user_id, pending_flag),
  KEY idx_request_room_status (room_id, status),
  CONSTRAINT fk_request_room FOREIGN KEY (room_id) REFERENCES room (id) ON DELETE CASCADE,
  CONSTRAINT fk_request_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT ck_request_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED'))
);

CREATE TABLE IF NOT EXISTS chat_message (
  id           BIGINT         NOT NULL AUTO_INCREMENT,
  room_id      BIGINT         NULL,
  sender_id    BIGINT         NOT NULL,
  receiver_id  BIGINT         NULL,
  content      VARCHAR(1000)  NOT NULL,
  created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at      DATETIME       NULL,
  PRIMARY KEY (id),
  KEY idx_chat_room (room_id, id),
  KEY idx_chat_direct (receiver_id, sender_id, read_at),
  CONSTRAINT fk_chat_room     FOREIGN KEY (room_id)     REFERENCES room (id)  ON DELETE CASCADE,
  CONSTRAINT fk_chat_sender   FOREIGN KEY (sender_id)   REFERENCES users (id),
  CONSTRAINT fk_chat_receiver FOREIGN KEY (receiver_id) REFERENCES users (id),
  CONSTRAINT ck_chat_target CHECK ((room_id IS NULL) <> (receiver_id IS NULL))
);

CREATE TABLE IF NOT EXISTS chat_read (
  room_id       BIGINT NOT NULL,
  user_id       BIGINT NOT NULL,
  last_read_id  BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (room_id, user_id),
  CONSTRAINT fk_chat_read_room FOREIGN KEY (room_id) REFERENCES room (id)  ON DELETE CASCADE,
  CONSTRAINT fk_chat_read_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS room_event (
  id          BIGINT        NOT NULL AUTO_INCREMENT,
  room_id     BIGINT        NULL,
  actor_id    BIGINT        NOT NULL,
  user_id     BIGINT        NOT NULL,
  kind        VARCHAR(20)   NOT NULL,
  reason      VARCHAR(200)  NULL,
  message_id  BIGINT        NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_event_actor (actor_id, kind),
  KEY idx_event_user (user_id, kind),
  KEY idx_event_message (message_id),
  CONSTRAINT fk_event_room    FOREIGN KEY (room_id)    REFERENCES room (id)         ON DELETE SET NULL,
  CONSTRAINT fk_event_actor   FOREIGN KEY (actor_id)   REFERENCES users (id)        ON DELETE CASCADE,
  CONSTRAINT fk_event_user    FOREIGN KEY (user_id)    REFERENCES users (id)        ON DELETE CASCADE,
  CONSTRAINT fk_event_message FOREIGN KEY (message_id) REFERENCES chat_message (id) ON DELETE SET NULL,
  CONSTRAINT ck_event_kind CHECK (kind IN ('KICK', 'LEAVE', 'HOST_CHANGE'))
);
