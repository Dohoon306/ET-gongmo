package com.gdgoc.et.bookmark;

import com.gdgoc.et.common.error.ApiException;
import com.gdgoc.et.common.error.ErrorResponse;
import com.gdgoc.et.common.web.CurrentUser;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookmarks")
public class BookmarkController {
    private final JdbcTemplate jdbc;

    public BookmarkController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/ids")
    public List<Long> ids(@CurrentUser Long userId) {
        requireUser(userId);
        return jdbc.queryForList("SELECT contest_id FROM bookmark WHERE user_id = ? ORDER BY contest_id",
                Long.class, userId);
    }

    @PutMapping("/{contestId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void save(@CurrentUser Long userId, @PathVariable long contestId) {
        requireUser(userId);
        boolean exists = Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM contest WHERE id = ?)", Boolean.class, contestId));
        if (!exists) {
            throw new ApiException(HttpStatus.NOT_FOUND, "공모전을 찾을 수 없습니다.");
        }
        jdbc.update("""
                INSERT INTO bookmark (user_id, contest_id) VALUES (?, ?)
                ON DUPLICATE KEY UPDATE created_at = bookmark.created_at
                """, userId, contestId);
    }

    @DeleteMapping("/{contestId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@CurrentUser Long userId, @PathVariable long contestId) {
        requireUser(userId);
        jdbc.update("DELETE FROM bookmark WHERE user_id = ? AND contest_id = ?", userId, contestId);
    }

    @ExceptionHandler(BadSqlGrammarException.class)
    public ResponseEntity<ErrorResponse> handleMissingTables(BadSqlGrammarException exception) {
        if (exception.getSQLException().getErrorCode() != 1146) {
            throw exception;
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ErrorResponse("사용자·공모전 테이블을 먼저 초기화해 주세요."));
    }

    private void requireUser(long userId) {
        if (!Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM users WHERE id = ?)", Boolean.class, userId))) {
            throw new ApiException(HttpStatus.NOT_FOUND, "현재 사용자를 찾을 수 없습니다.");
        }
    }
}
