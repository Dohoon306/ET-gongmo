package com.gdgoc.et.profile;

import com.gdgoc.et.common.error.ApiException;
import com.gdgoc.et.common.error.ErrorResponse;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProfileController {
    private final JdbcTemplate jdbc;

    public ProfileController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/api/users/{userId}/profile")
    @Transactional(readOnly = true)
    public Profile profile(@PathVariable long userId) {
        Map<String, Object> user = jdbc.queryForList("SELECT name, intro FROM users WHERE id = ?", userId)
                .stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
        Long photoVersion = jdbc.queryForList("SELECT updated_at FROM user_photo WHERE user_id = ?",
                Timestamp.class, userId).stream().findFirst().map(Timestamp::getTime).orElse(null);
        List<String> categories = jdbc.queryForList("""
                SELECT c.name
                FROM user_category uc JOIN category c ON c.id = uc.category_id
                WHERE uc.user_id = ?
                ORDER BY c.sort_order, c.id
                """, String.class, userId);
        List<Team> teams = jdbc.query("""
                SELECT r.id, r.title, r.status,
                       (SELECT COUNT(*) FROM room_member members WHERE members.room_id = r.id) AS member_count
                FROM room_member m JOIN room r ON r.id = m.room_id
                WHERE m.user_id = ?
                ORDER BY r.created_at DESC, r.id DESC
                """, (row, index) -> new Team(row.getLong("id"), row.getString("title"),
                row.getString("status"), row.getInt("member_count")), userId);
        Rating rating = jdbc.queryForObject("""
                SELECT ROUND(AVG(score), 1) AS avg_score, COUNT(*) AS eval_count
                FROM evaluation
                WHERE target_id = ?
                """, (row, index) -> new Rating(row.getBigDecimal("avg_score"), row.getLong("eval_count")), userId);
        List<ReviewComment> comments = jdbc.query("""
                SELECT score, comment
                FROM evaluation
                WHERE target_id = ? AND comment IS NOT NULL
                ORDER BY score DESC, comment ASC
                """, (row, index) -> new ReviewComment(row.getInt("score"), row.getString("comment")), userId);
        return new Profile(userId, (String) user.get("name"), (String) user.get("intro"), photoVersion, categories,
                teams, rating, comments);
    }

    @ExceptionHandler(BadSqlGrammarException.class)
    public ResponseEntity<ErrorResponse> handleMissingTables(BadSqlGrammarException exception) {
        if (exception.getSQLException().getErrorCode() != 1146) {
            throw exception;
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ErrorResponse("사용자·팀 테이블을 먼저 초기화해 주세요."));
    }

    public record Profile(long id, String name, String intro, Long photoVersion, List<String> categories, List<Team> teams, Rating rating,
                          List<ReviewComment> comments) {
    }

    public record Team(long id, String title, String status, int memberCount) {
    }

    public record Rating(BigDecimal avgScore, long evalCount) {
    }

    public record ReviewComment(int score, String comment) {
    }

}
