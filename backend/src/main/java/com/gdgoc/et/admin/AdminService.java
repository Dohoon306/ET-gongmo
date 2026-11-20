package com.gdgoc.et.admin;

import com.gdgoc.et.common.error.ApiException;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final String DATETIME = "'%Y-%m-%dT%H:%i:%s'";

    private final JdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate named;

    public record UserRow(long id, String name, String intro, String createdAt, boolean admin, boolean suspended,
                          String suspendReason, long reportCount, List<String> categories) {}

    public record EvaluationRow(long id, long roomId, String roomTitle, long evaluatorId, String evaluatorName,
                                long targetId, String targetName, int score, String comment, String createdAt) {}

    public record AppealRow(long id, long evaluationId, String roomTitle, long evaluatorId, String evaluatorName,
                            long targetId, String targetName, int score, String comment, String reason, String status,
                            String createdAt) {}

    public record ReportMessage(long senderId, String senderName, String content, String sentAt) {}

    public record ReportRow(long id, long reporterId, String reporterName, long targetId, String targetName,
                            List<String> reasons, String detail, String source, Long roomId, String roomTitle,
                            String createdAt, List<ReportMessage> messages) {}

    public record ContestRow(long id, long gongmoaId, String title, String type, String host, String startDate,
                             String endDate, String target, String prize, String benefit, String gongmoaUrl,
                             String sourceUrl, List<Long> categoryIds) {}

    public record ContestInput(String title, String type, String host, LocalDate startDate, LocalDate endDate,
                               String target, String prize, String benefit, String gongmoaUrl, String sourceUrl,
                               List<Long> categoryIds) {}

    public boolean isAdmin(Long userId) {
        if (userId == null) {
            return false;
        }
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM admin_account WHERE user_id = ?", Integer.class, userId);
        return count != null && count > 0;
    }

    public void requireAdmin(Long userId) {
        if (!isAdmin(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "관리자만 쓸 수 있어요");
        }
    }

    public List<UserRow> users() {
        return jdbc.query("""
                SELECT u.id, u.name, u.intro, DATE_FORMAT(u.created_at, %s) AS created_at,
                       a.user_id IS NOT NULL AS is_admin, s.user_id IS NOT NULL AS is_suspended, s.reason,
                       (SELECT COUNT(*) FROM user_report r WHERE r.target_id = u.id) AS report_count,
                       (SELECT GROUP_CONCAT(c.name ORDER BY c.sort_order SEPARATOR ',')
                        FROM user_category uc JOIN category c ON c.id = uc.category_id WHERE uc.user_id = u.id) AS categories
                FROM users u
                LEFT JOIN admin_account a ON a.user_id = u.id
                LEFT JOIN user_suspension s ON s.user_id = u.id
                ORDER BY u.id
                """.formatted(DATETIME), (rs, i) -> new UserRow(rs.getLong("id"), rs.getString("name"),
                rs.getString("intro"), rs.getString("created_at"), rs.getBoolean("is_admin"),
                rs.getBoolean("is_suspended"), rs.getString("reason"), rs.getLong("report_count"),
                splitList(rs.getString("categories"))));
    }

    @Transactional
    public void suspend(long userId, String reason) {
        requireUser(userId);
        if (isAdmin(userId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "관리자 계정은 정지할 수 없어요");
        }
        String cleaned = reason == null || reason.isBlank() ? null : truncate(reason.strip(), 200);
        jdbc.update("""
                INSERT INTO user_suspension (user_id, reason) VALUES (?, ?)
                ON DUPLICATE KEY UPDATE reason = VALUES(reason)
                """, userId, cleaned);
    }

    @Transactional
    public void unsuspend(long userId) {
        jdbc.update("DELETE FROM user_suspension WHERE user_id = ?", userId);
    }

    public List<EvaluationRow> evaluations(Long userId) {
        MapSqlParameterSource params = new MapSqlParameterSource("userId", userId);
        return named.query("""
                SELECT e.id, e.room_id, r.title AS room_title, e.evaluator_id, ev.name AS evaluator_name,
                       e.target_id, t.name AS target_name, e.score, e.comment,
                       DATE_FORMAT(e.created_at, %s) AS created_at
                FROM evaluation e
                JOIN room r ON r.id = e.room_id
                JOIN users ev ON ev.id = e.evaluator_id
                JOIN users t ON t.id = e.target_id
                WHERE :userId IS NULL OR e.evaluator_id = :userId OR e.target_id = :userId
                ORDER BY e.id DESC
                """.formatted(DATETIME), params, (rs, i) -> new EvaluationRow(rs.getLong("id"), rs.getLong("room_id"),
                rs.getString("room_title"), rs.getLong("evaluator_id"), rs.getString("evaluator_name"),
                rs.getLong("target_id"), rs.getString("target_name"), rs.getInt("score"), rs.getString("comment"),
                rs.getString("created_at")));
    }

    public List<AppealRow> appeals() {
        return jdbc.query("""
                SELECT a.id, a.evaluation_id, r.title AS room_title, a.evaluator_id, ev.name AS evaluator_name,
                       a.target_id, t.name AS target_name, a.score, a.comment, a.reason, a.status,
                       DATE_FORMAT(a.created_at, %s) AS created_at
                FROM evaluation_appeal a
                LEFT JOIN room r ON r.id = a.room_id
                LEFT JOIN users ev ON ev.id = a.evaluator_id
                LEFT JOIN users t ON t.id = a.target_id
                ORDER BY a.status = 'PENDING' DESC, a.id DESC
                """.formatted(DATETIME), (rs, i) -> new AppealRow(rs.getLong("id"), rs.getLong("evaluation_id"),
                rs.getString("room_title"), rs.getLong("evaluator_id"), rs.getString("evaluator_name"),
                rs.getLong("target_id"), rs.getString("target_name"), rs.getInt("score"), rs.getString("comment"),
                rs.getString("reason"), rs.getString("status"), rs.getString("created_at")));
    }

    @Transactional
    public void decideAppeal(long appealId, boolean remove) {
        Map<String, Object> appeal = jdbc.queryForList(
                "SELECT evaluation_id, status FROM evaluation_appeal WHERE id = ? FOR UPDATE", appealId)
                .stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "항의를 찾을 수 없어요"));
        if (!"PENDING".equals(appeal.get("status"))) {
            throw new ApiException(HttpStatus.CONFLICT, "이미 처리한 항의예요");
        }
        if (remove) {
            jdbc.update("DELETE FROM evaluation WHERE id = ?", appeal.get("evaluation_id"));
        }
        jdbc.update("UPDATE evaluation_appeal SET status = ?, decided_at = NOW() WHERE id = ?",
                remove ? "REMOVED" : "REJECTED", appealId);
    }

    @Transactional
    public void removeEvaluation(long evaluationId) {
        jdbc.update("""
                UPDATE evaluation_appeal SET status = 'REMOVED', decided_at = NOW()
                WHERE evaluation_id = ? AND status = 'PENDING'
                """, evaluationId);
        if (jdbc.update("DELETE FROM evaluation WHERE id = ?", evaluationId) == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "평가를 찾을 수 없어요");
        }
    }

    public List<ReportRow> reports() {
        List<ReportRow> reports = jdbc.query("""
                SELECT p.id, p.reporter_id, rp.name AS reporter_name, p.target_id, t.name AS target_name,
                       p.reasons, p.detail, p.source, p.room_id, r.title AS room_title,
                       DATE_FORMAT(p.created_at, %s) AS created_at
                FROM user_report p
                JOIN users rp ON rp.id = p.reporter_id
                JOIN users t ON t.id = p.target_id
                LEFT JOIN room r ON r.id = p.room_id
                ORDER BY p.id DESC
                """.formatted(DATETIME), (rs, i) -> new ReportRow(rs.getLong("id"), rs.getLong("reporter_id"),
                rs.getString("reporter_name"), rs.getLong("target_id"), rs.getString("target_name"),
                splitList(rs.getString("reasons")), rs.getString("detail"), rs.getString("source"),
                (Long) rs.getObject("room_id", Long.class), rs.getString("room_title"), rs.getString("created_at"),
                List.of()));
        if (reports.isEmpty()) {
            return reports;
        }
        Map<Long, List<ReportMessage>> messages = named.query("""
                SELECT report_id, sender_id, sender_name, content, DATE_FORMAT(sent_at, %s) AS sent_at
                FROM user_report_message WHERE report_id IN (:ids) ORDER BY id
                """.formatted(DATETIME), Map.of("ids", reports.stream().map(ReportRow::id).toList()),
                (rs, i) -> Map.entry(rs.getLong("report_id"), new ReportMessage(rs.getLong("sender_id"),
                        rs.getString("sender_name"), rs.getString("content"), rs.getString("sent_at"))))
                .stream().collect(Collectors.groupingBy(Map.Entry::getKey,
                        Collectors.mapping(Map.Entry::getValue, Collectors.toList())));
        return reports.stream().map(r -> new ReportRow(r.id(), r.reporterId(), r.reporterName(), r.targetId(),
                r.targetName(), r.reasons(), r.detail(), r.source(), r.roomId(), r.roomTitle(), r.createdAt(),
                messages.getOrDefault(r.id(), List.of()))).toList();
    }

    public List<ContestRow> contests() {
        Map<Long, List<Long>> categories = jdbc.query("SELECT contest_id, category_id FROM contest_category",
                        (rs, i) -> Map.entry(rs.getLong("contest_id"), rs.getLong("category_id")))
                .stream().collect(Collectors.groupingBy(Map.Entry::getKey,
                        Collectors.mapping(Map.Entry::getValue, Collectors.toList())));
        return jdbc.query("""
                SELECT id, gongmoa_id, title, type, host, start_date, end_date, target, prize, benefit,
                       gongmoa_url, source_url
                FROM contest ORDER BY end_date IS NULL, end_date DESC, id DESC
                """, (rs, i) -> new ContestRow(rs.getLong("id"), rs.getLong("gongmoa_id"), rs.getString("title"),
                rs.getString("type"), rs.getString("host"), rs.getString("start_date"), rs.getString("end_date"),
                rs.getString("target"), rs.getString("prize"), rs.getString("benefit"), rs.getString("gongmoa_url"),
                rs.getString("source_url"), categories.getOrDefault(rs.getLong("id"), List.of())));
    }

    @Transactional
    public long createContest(ContestInput input) {
        ContestInput c = clean(input);
        Long minGongmoaId = jdbc.queryForObject("SELECT LEAST(COALESCE(MIN(gongmoa_id), 0), 0) FROM contest", Long.class);
        long gongmoaId = (minGongmoaId == null ? 0 : minGongmoaId) - 1;
        GeneratedKeyHolder key = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement("""
                    INSERT INTO contest (gongmoa_id, title, type, host, start_date, end_date, target, prize, benefit,
                                         gongmoa_url, source_url, fetched_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                    """, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, gongmoaId);
            ps.setString(2, c.title());
            ps.setString(3, c.type());
            ps.setString(4, c.host());
            ps.setDate(5, c.startDate() == null ? null : Date.valueOf(c.startDate()));
            ps.setDate(6, c.endDate() == null ? null : Date.valueOf(c.endDate()));
            ps.setString(7, c.target());
            ps.setString(8, c.prize());
            ps.setString(9, c.benefit());
            ps.setString(10, c.gongmoaUrl() == null ? "" : c.gongmoaUrl());
            ps.setString(11, c.sourceUrl());
            return ps;
        }, key);
        long contestId = key.getKey().longValue();
        replaceCategories(contestId, c.categoryIds());
        return contestId;
    }

    @Transactional
    public void updateContest(long contestId, ContestInput input) {
        ContestInput c = clean(input);
        int updated = jdbc.update("""
                UPDATE contest SET title = ?, type = ?, host = ?, start_date = ?, end_date = ?, target = ?, prize = ?,
                                   benefit = ?, gongmoa_url = ?, source_url = ?
                WHERE id = ?
                """, c.title(), c.type(), c.host(), c.startDate() == null ? null : Date.valueOf(c.startDate()),
                c.endDate() == null ? null : Date.valueOf(c.endDate()), c.target(), c.prize(), c.benefit(),
                c.gongmoaUrl() == null ? "" : c.gongmoaUrl(), c.sourceUrl(), contestId);
        if (updated == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "공모전을 찾을 수 없어요");
        }
        replaceCategories(contestId, c.categoryIds());
    }

    @Transactional
    public void deleteContest(long contestId) {
        Integer rooms = jdbc.queryForObject("SELECT COUNT(*) FROM room WHERE contest_id = ?", Integer.class, contestId);
        if (rooms != null && rooms > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "모집 방이 있는 공모전은 지울 수 없어요");
        }
        if (jdbc.update("DELETE FROM contest WHERE id = ?", contestId) == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "공모전을 찾을 수 없어요");
        }
    }

    private void replaceCategories(long contestId, List<Long> categoryIds) {
        jdbc.update("DELETE FROM contest_category WHERE contest_id = ?", contestId);
        if (categoryIds.isEmpty()) {
            return;
        }
        Integer known = named.queryForObject("SELECT COUNT(*) FROM category WHERE id IN (:ids)",
                Map.of("ids", categoryIds), Integer.class);
        if (known == null || known != categoryIds.size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "없는 태그가 들어 있어요");
        }
        jdbc.batchUpdate("INSERT INTO contest_category (contest_id, category_id) VALUES (?, ?)",
                categoryIds.stream().map(id -> new Object[] {contestId, id}).toList());
    }

    static ContestInput clean(ContestInput c) {
        String title = blankToNull(c.title());
        if (title == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "공모전 제목을 입력해 주세요");
        }
        if (c.startDate() != null && c.endDate() != null && c.endDate().isBefore(c.startDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "마감일이 시작일보다 앞서요");
        }
        return new ContestInput(truncate(title, 255), limited(c.type(), 20), limited(c.host(), 255), c.startDate(),
                c.endDate(), limited(c.target(), 100), limited(c.prize(), 100), limited(c.benefit(), 100),
                limited(c.gongmoaUrl(), 500), limited(c.sourceUrl(), 500),
                c.categoryIds() == null ? List.of() : c.categoryIds().stream().distinct().toList());
    }

    private void requireUser(long userId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE id = ?", Integer.class, userId);
        if (count == null || count == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없어요");
        }
    }

    private static String limited(String value, int max) {
        String text = blankToNull(value);
        return text == null ? null : truncate(text, max);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    private static String truncate(String value, int max) {
        return value.length() > max ? value.substring(0, max) : value;
    }

    static List<String> splitList(String joined) {
        return joined == null || joined.isBlank() ? List.of() : Arrays.stream(joined.split(",")).toList();
    }
}
