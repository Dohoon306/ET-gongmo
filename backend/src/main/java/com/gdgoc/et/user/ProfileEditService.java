package com.gdgoc.et.user;

import com.gdgoc.et.common.error.ApiException;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileEditService {

    static final int MAX_NAME = 30;
    static final int MAX_INTRO = 1000;
    static final int MAX_PHOTO_BYTES = 1_000_000;

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
                            LocalDateTime nameChangeAvailableAt, Long photoVersion) {}

    public record PhotoFile(String contentType, byte[] data) {}

    @Transactional(readOnly = true)
    public MyAccount me(long userId) {
        Map<String, Object> user = jdbc.queryForList("SELECT name, intro FROM users WHERE id = ?", userId)
                .stream().findFirst().orElseThrow(ProfileEditService::userNotFound);
        List<Long> categoryIds = jdbc.queryForList(
                "SELECT category_id FROM user_category WHERE user_id = ? ORDER BY category_id", Long.class, userId);
        Long photoVersion = jdbc.queryForList("SELECT updated_at FROM user_photo WHERE user_id = ?",
                Timestamp.class, userId).stream().findFirst().map(Timestamp::getTime).orElse(null);
        return new MyAccount(userId, (String) user.get("name"), (String) user.get("intro"), categoryIds,
                nameChangeAvailableAt(userId, now()), photoVersion);
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

    @Transactional
    public MyAccount changePhoto(long userId, byte[] data) {
        if (data == null || data.length == 0) {
            throw badRequest("사진 파일을 골라 주세요");
        }
        if (data.length > MAX_PHOTO_BYTES) {
            throw badRequest("사진은 1MB 이하만 올릴 수 있어요");
        }
        String contentType = imageTypeOf(data)
                .orElseThrow(() -> badRequest("PNG, JPG, WEBP 사진만 올릴 수 있어요"));
        requireUser(userId);
        jdbc.update("""
                INSERT INTO user_photo (user_id, content_type, data, updated_at) VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE content_type = VALUES(content_type), data = VALUES(data),
                  updated_at = VALUES(updated_at)
                """, userId, contentType, data, now());
        return me(userId);
    }

    @Transactional
    public MyAccount deletePhoto(long userId) {
        requireUser(userId);
        jdbc.update("DELETE FROM user_photo WHERE user_id = ?", userId);
        return me(userId);
    }

    @Transactional(readOnly = true)
    public Optional<PhotoFile> photo(long userId) {
        return jdbc.query("SELECT content_type, data FROM user_photo WHERE user_id = ?",
                (rs, i) -> new PhotoFile(rs.getString("content_type"), rs.getBytes("data")), userId).stream().findFirst();
    }

    @Transactional(readOnly = true)
    public Map<Long, Long> photoVersions() {
        Map<Long, Long> versions = new LinkedHashMap<>();
        jdbc.query("SELECT user_id, updated_at FROM user_photo ORDER BY user_id",
                rs -> {
                    versions.put(rs.getLong("user_id"), rs.getTimestamp("updated_at").getTime());
                });
        return versions;
    }

    static Optional<String> imageTypeOf(byte[] data) {
        if (startsWith(data, 0, 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A)) {
            return Optional.of("image/png");
        }
        if (startsWith(data, 0, 0xFF, 0xD8, 0xFF)) {
            return Optional.of("image/jpeg");
        }
        if (startsWith(data, 0, 'R', 'I', 'F', 'F') && startsWith(data, 8, 'W', 'E', 'B', 'P')) {
            return Optional.of("image/webp");
        }
        return Optional.empty();
    }

    private static boolean startsWith(byte[] data, int offset, int... expected) {
        if (data.length < offset + expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if ((data[offset + i] & 0xFF) != expected[i]) {
                return false;
            }
        }
        return true;
    }

    private LocalDateTime nameChangeAvailableAt(long userId, LocalDateTime now) {
        return jdbc.queryForList("SELECT changed_at FROM user_name_change WHERE user_id = ?", Timestamp.class, userId)
                .stream().findFirst()
                .map(changed -> changed.toLocalDateTime().plusMonths(1))
                .filter(now::isBefore)
                .orElse(null);
    }

    private void requireUser(long userId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE id = ?", Integer.class, userId);
        if (count == null || count == 0) {
            throw userNotFound();
        }
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
