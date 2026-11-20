package com.gdgoc.et.user;

import com.gdgoc.et.common.error.ApiException;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileEditService {

    static final int MAX_NAME = 30;
    static final int MAX_INTRO = 1000;

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter AVAILABLE_AT = DateTimeFormatter.ofPattern("M월 d일 HH:mm");

    private final JdbcTemplate jdbc;
    private final Clock clock;

    @Autowired
    ProfileEditService(JdbcTemplate jdbc) {
        this(jdbc, Clock.system(SEOUL));
    }

    ProfileEditService(JdbcTemplate jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    public record MyAccount(long id, String name, String intro, List<Long> categoryIds,
                            LocalDateTime nameChangeAvailableAt) {}

    @Transactional(readOnly = true)
    public MyAccount me(long userId) {
        Map<String, Object> user = jdbc.queryForList("SELECT name, intro FROM users WHERE id = ?", userId)
                .stream().findFirst().orElseThrow(ProfileEditService::userNotFound);
        List<Long> categoryIds = jdbc.queryForList(
                "SELECT category_id FROM user_category WHERE user_id = ? ORDER BY category_id", Long.class, userId);
        return new MyAccount(userId, (String) user.get("name"), (String) user.get("intro"), categoryIds,
                nameChangeAvailableAt(userId, now()));
    }

    @Transactional
    public MyAccount changeName(long userId, String name) {
        String clean = name == null ? "" : name.strip();
        if (clean.isEmpty()) {
            throw badRequest("이름을 입력해 주세요");
        }
        if (clean.length() > MAX_NAME) {
            throw badRequest("이름은 " + MAX_NAME + "자 이하로 입력해 주세요");
        }
        String current = jdbc.queryForList("SELECT name FROM users WHERE id = ? FOR UPDATE", String.class, userId)
                .stream().findFirst().orElseThrow(ProfileEditService::userNotFound);
        if (clean.equals(current)) {
            throw badRequest("지금 이름과 같아요");
        }
        LocalDateTime now = now();
        LocalDateTime availableAt = nameChangeAvailableAt(userId, now);
        if (availableAt != null) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "이름은 한 달에 한 번만 바꿀 수 있어요. " + availableAt.format(AVAILABLE_AT) + "부터 다시 바꿀 수 있어요");
        }
        jdbc.update("UPDATE users SET name = ? WHERE id = ?", clean, userId);
        jdbc.update("""
                INSERT INTO user_name_change (user_id, changed_at) VALUES (?, ?)
                ON DUPLICATE KEY UPDATE changed_at = VALUES(changed_at)
                """, userId, now);
        return me(userId);
    }

    @Transactional
    public MyAccount changeIntro(long userId, String intro) {
        String clean = intro == null ? "" : intro.strip();
        if (clean.isEmpty()) {
            throw badRequest("자기소개를 입력해 주세요");
        }
        if (clean.length() > MAX_INTRO) {
            throw badRequest("자기소개는 " + MAX_INTRO + "자 이하로 입력해 주세요");
        }
        if (jdbc.update("UPDATE users SET intro = ? WHERE id = ?", clean, userId) == 0) {
            throw userNotFound();
        }
        return me(userId);
    }

    private LocalDateTime nameChangeAvailableAt(long userId, LocalDateTime now) {
        return jdbc.queryForList("SELECT changed_at FROM user_name_change WHERE user_id = ?", Timestamp.class, userId)
                .stream().findFirst()
                .map(changed -> changed.toLocalDateTime().plusMonths(1))
                .filter(now::isBefore)
                .orElse(null);
    }

    private LocalDateTime now() {
        return LocalDateTime.now(clock).withNano(0);
    }

    private static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    private static ApiException userNotFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없어요");
    }
}
