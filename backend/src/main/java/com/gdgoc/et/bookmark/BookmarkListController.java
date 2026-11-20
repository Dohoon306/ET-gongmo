package com.gdgoc.et.bookmark;

import com.gdgoc.et.common.error.ApiException;
import com.gdgoc.et.common.error.ErrorResponse;
import com.gdgoc.et.common.web.CurrentUser;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookmarkListController {
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private final JdbcTemplate jdbc;

    public BookmarkListController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/api/bookmarks")
    public List<SavedContest> list(@CurrentUser Long userId) {
        if (!Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM users WHERE id = ?)", Boolean.class, userId))) {
            throw new ApiException(HttpStatus.NOT_FOUND, "현재 사용자를 찾을 수 없습니다.");
        }
        LocalDate today = LocalDate.now(SEOUL);
        return jdbc.query("""
                SELECT c.id, c.title, c.host, c.end_date, c.prize
                FROM bookmark b
                JOIN contest c ON c.id = b.contest_id
                WHERE b.user_id = ?
                ORDER BY (c.end_date >= ?) DESC, c.end_date ASC, c.id ASC
                """, (row, index) -> new SavedContest(row.getLong("id"), row.getString("title"),
                row.getString("host"), row.getObject("end_date", LocalDate.class), row.getString("prize")), userId, today);
    }

    @ExceptionHandler(BadSqlGrammarException.class)
    public ResponseEntity<ErrorResponse> handleMissingTables(BadSqlGrammarException exception) {
        if (exception.getSQLException().getErrorCode() != 1146) {
            throw exception;
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ErrorResponse("사용자·공모전 테이블을 먼저 초기화해 주세요."));
    }

    public record SavedContest(long id, String title, String host, LocalDate endDate, String prize) {
    }
}
