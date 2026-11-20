package com.gdgoc.et.profile;

import com.gdgoc.et.common.error.ApiException;
import com.gdgoc.et.common.error.ErrorResponse;
import com.gdgoc.et.common.web.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TeamReviewController {
    private final JdbcTemplate jdbc;

    public TeamReviewController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/api/rooms/{roomId}/reviews")
    @Transactional(readOnly = true)
    public ReviewRoom reviewRoom(@CurrentUser Long userId, @PathVariable long roomId) {
        Team team = requireClosedTeam(roomId, userId);
        Map<Long, List<String>> tags = jdbc.query("""
                SELECT uc.user_id, c.name
                FROM room_member m
                JOIN user_category uc ON uc.user_id = m.user_id
                JOIN category c ON c.id = uc.category_id
                WHERE m.room_id = ? AND m.user_id <> ?
                ORDER BY c.sort_order, c.id
                """, rows -> {
            Map<Long, List<String>> result = new HashMap<>();
            while (rows.next()) {
                result.computeIfAbsent(rows.getLong("user_id"), id -> new ArrayList<>()).add(rows.getString("name"));
            }
            return result;
        }, roomId, userId);
        List<ReviewTarget> targets = jdbc.query("""
                SELECT u.id, u.name, e.id IS NOT NULL AS reviewed
                FROM room_member m
                JOIN users u ON u.id = m.user_id
                LEFT JOIN evaluation e ON e.room_id = m.room_id AND e.target_id = m.user_id AND e.evaluator_id = ?
                WHERE m.room_id = ? AND m.user_id <> ?
                ORDER BY u.id
                """, (row, index) -> new ReviewTarget(row.getLong("id"), row.getString("name"),
                row.getBoolean("reviewed"), tags.getOrDefault(row.getLong("id"), List.of())), userId, roomId, userId);
        return new ReviewRoom(team.id(), team.title(), targets);
    }

    @PostMapping("/api/rooms/{roomId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public void submitReview(@CurrentUser Long userId, @PathVariable long roomId,
                             @Valid @RequestBody ReviewRequest request) {
        requireOtherTeamMember(roomId, userId, request.targetId());
        int score = integerScore(request.score());
        try {
            int inserted = jdbc.update("""
                    INSERT INTO evaluation (room_id, evaluator_id, target_id, score, comment)
                    SELECT r.id, evaluator.user_id, target.user_id, ?, ?
                    FROM room r
                    JOIN room_member evaluator ON evaluator.room_id = r.id AND evaluator.user_id = ?
                    JOIN room_member target ON target.room_id = r.id AND target.user_id = ?
                    WHERE r.id = ? AND r.status = 'CLOSED'
                    """, score, normalizeComment(request.comment()),
                    userId, request.targetId(), roomId);
            if (inserted == 0) {
                throw new ApiException(HttpStatus.FORBIDDEN, "종료된 팀의 같은 팀원만 평가할 수 있습니다.");
            }
        } catch (DuplicateKeyException exception) {
            throw new ApiException(HttpStatus.CONFLICT, "이미 평가했어요.");
        }
    }

    @GetMapping("/api/rooms/{roomId}/reviews/{targetId}")
    @Transactional(readOnly = true)
    public ResponseEntity<ReviewContent> ownReview(@CurrentUser Long userId, @PathVariable long roomId,
                                                    @PathVariable long targetId) {
        requireOtherTeamMember(roomId, userId, targetId);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(requireOwnReview(roomId, userId, targetId, false));
    }

    @PatchMapping("/api/rooms/{roomId}/reviews/{targetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void editReview(@CurrentUser Long userId, @PathVariable long roomId, @PathVariable long targetId,
                           @Valid @RequestBody ReviewContent request) {
        requireOtherTeamMember(roomId, userId, targetId);
        int score = integerScore(request.score());
        requireOwnReview(roomId, userId, targetId, true);
        jdbc.update("""
                UPDATE evaluation
                SET score = ?, comment = ?
                WHERE room_id = ? AND evaluator_id = ? AND target_id = ?
                """, score, normalizeComment(request.comment()), roomId, userId, targetId);
    }

    private ReviewContent requireOwnReview(long roomId, long userId, long targetId, boolean lockForUpdate) {
        String sql = """
                SELECT e.score, e.comment
                FROM evaluation e
                JOIN room r ON r.id = e.room_id AND r.status = 'CLOSED'
                JOIN room_member evaluator ON evaluator.room_id = r.id AND evaluator.user_id = e.evaluator_id
                JOIN room_member target ON target.room_id = r.id AND target.user_id = e.target_id
                WHERE e.room_id = ? AND e.evaluator_id = ? AND e.target_id = ?
                """;
        return jdbc.query(lockForUpdate ? sql + "FOR UPDATE" : sql,
                (row, index) -> new ReviewContent(row.getBigDecimal("score"), row.getString("comment")),
                roomId, userId, targetId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "작성한 평가를 찾을 수 없습니다."));
    }

    private void requireOtherTeamMember(long roomId, long userId, long targetId) {
        if (userId == targetId) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "본인은 평가할 수 없습니다.");
        }
        requireClosedTeam(roomId, userId);
        if (!isTeamMember(roomId, targetId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "종료된 팀의 같은 팀원만 평가할 수 있습니다.");
        }
    }

    private static int integerScore(BigDecimal score) {
        if (score.stripTrailingZeros().scale() > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "별점은 1점부터 5점까지 정수로 골라 주세요.");
        }
        return score.intValueExact();
    }

    private static String normalizeComment(String comment) {
        if (comment == null) {
            return null;
        }
        String normalized = comment.replaceAll("\\R", " ").strip();
        return normalized.isEmpty() ? null : normalized;
    }

    @ExceptionHandler(BadSqlGrammarException.class)
    public ResponseEntity<ErrorResponse> handleMissingTables(BadSqlGrammarException exception) {
        if (exception.getSQLException().getErrorCode() != 1146) {
            throw exception;
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ErrorResponse("사용자·팀 테이블을 먼저 초기화해 주세요."));
    }

    private Team requireClosedTeam(long roomId, long userId) {
        Team team = jdbc.query("SELECT id, title, status FROM room WHERE id = ?",
                (row, index) -> new Team(row.getLong("id"), row.getString("title"), row.getString("status")), roomId)
                .stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "팀을 찾을 수 없습니다."));
        if (!isTeamMember(roomId, userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "같은 팀의 팀원만 평가할 수 있습니다.");
        }
        if (!"CLOSED".equals(team.status())) {
            throw new ApiException(HttpStatus.CONFLICT, "종료된 팀만 평가할 수 있습니다.");
        }
        return team;
    }

    private boolean isTeamMember(long roomId, long userId) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM room_member WHERE room_id = ? AND user_id = ?)",
                Boolean.class, roomId, userId));
    }

    public record Team(long id, String title, String status) {
    }

    public record ReviewRoom(long id, String title, List<ReviewTarget> targets) {
    }

    public record ReviewTarget(long id, String name, boolean reviewed, List<String> categories) {
    }

    public record ReviewRequest(@NotNull @Positive Long targetId,
                                @NotNull @DecimalMin("1") @DecimalMax("5") BigDecimal score,
                                @Size(max = 200) String comment) {
    }

    public record ReviewContent(@NotNull @DecimalMin("1") @DecimalMax("5") BigDecimal score,
                                @Size(max = 200) String comment) {
    }
}
