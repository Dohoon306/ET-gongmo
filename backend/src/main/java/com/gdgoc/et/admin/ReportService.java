package com.gdgoc.et.admin;

import com.gdgoc.et.common.error.ApiException;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportService {

    static final Set<String> REASONS = Set.of("AD", "ABUSE", "DISRUPT", "LOW_PARTICIPATION", "ETC");
    static final Set<String> SOURCES = Set.of("PROFILE", "TEAM_CHAT", "DIRECT");
    static final int SNAPSHOT_SIZE = 50;

    private final JdbcTemplate jdbc;

    public record ReportInput(long targetId, List<String> reasons, String detail, String source, Long roomId) {}

    public record MyEvaluation(long id, int score, String comment, String appealStatus, String appealReason) {}

    @Transactional
    public long report(long reporterId, ReportInput input) {
        List<String> reasons = validReasons(input.reasons());
        String source = input.source() == null ? "PROFILE" : input.source();
        if (!SOURCES.contains(source)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "신고한 곳이 올바르지 않아요");
        }
        if (reporterId == input.targetId()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "나 자신은 신고할 수 없어요");
        }
        Integer target = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE id = ?", Integer.class, input.targetId());
        if (target == null || target == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없어요");
        }
        String detail = input.detail() == null || input.detail().isBlank() ? null : input.detail().strip();
        if (detail != null && detail.length() > 1000) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "신고 내용은 1000자까지 쓸 수 있어요");
        }
        if (reasons.contains("ETC") && detail == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "기타를 고르면 이유를 적어 주세요");
        }
        Long roomId = "TEAM_CHAT".equals(source) ? input.roomId() : null;
        if ("TEAM_CHAT".equals(source)) {
            requireBothMembers(roomId, reporterId, input.targetId());
        }

        GeneratedKeyHolder key = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement("""
                    INSERT INTO user_report (reporter_id, target_id, reasons, detail, source, room_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, reporterId);
            ps.setLong(2, input.targetId());
            ps.setString(3, String.join(",", reasons));
            ps.setString(4, detail);
            ps.setString(5, source);
            ps.setObject(6, roomId);
            return ps;
        }, key);
        long reportId = key.getKey().longValue();
        snapshotMessages(reportId, source, roomId, reporterId, input.targetId());
        return reportId;
    }

    private void snapshotMessages(long reportId, String source, Long roomId, long reporterId, long targetId) {
        String latest = switch (source) {
            case "TEAM_CHAT" -> "SELECT m.id, m.sender_id, u.name, m.content, m.created_at FROM chat_message m "
                    + "JOIN users u ON u.id = m.sender_id WHERE m.room_id = ? ORDER BY m.id DESC LIMIT " + SNAPSHOT_SIZE;
            case "DIRECT" -> "SELECT m.id, m.sender_id, u.name, m.content, m.created_at FROM chat_message m "
                    + "JOIN users u ON u.id = m.sender_id WHERE m.room_id IS NULL "
                    + "AND ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)) "
                    + "ORDER BY m.id DESC LIMIT " + SNAPSHOT_SIZE;
            default -> null;
        };
        if (latest == null) {
            return;
        }
        Object[] args = "TEAM_CHAT".equals(source) ? new Object[] {roomId}
                : new Object[] {reporterId, targetId, targetId, reporterId};
        jdbc.update("""
                INSERT INTO user_report_message (report_id, sender_id, sender_name, content, sent_at)
                SELECT ?, x.sender_id, x.name, x.content, x.created_at FROM (%s) x ORDER BY x.id
                """.formatted(latest), prepend(reportId, args));
    }

    public List<MyEvaluation> myEvaluations(long userId) {
        return jdbc.query("""
                SELECT e.id, e.score, e.comment,
                       (SELECT a.status FROM evaluation_appeal a WHERE a.evaluation_id = e.id ORDER BY a.id DESC LIMIT 1) AS appeal_status,
                       (SELECT a.reason FROM evaluation_appeal a WHERE a.evaluation_id = e.id ORDER BY a.id DESC LIMIT 1) AS appeal_reason
                FROM evaluation e
                WHERE e.target_id = ?
                ORDER BY e.score DESC, e.comment
                """, (rs, i) -> new MyEvaluation(rs.getLong("id"), rs.getInt("score"), rs.getString("comment"),
                rs.getString("appeal_status"), rs.getString("appeal_reason")), userId);
    }

    @Transactional
    public void appeal(long userId, long evaluationId, String reason) {
        String text = reason == null ? "" : reason.strip();
        if (text.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "항의 이유를 적어 주세요");
        }
        if (text.length() > 1000) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "항의 이유는 1000자까지 쓸 수 있어요");
        }
        Map<String, Object> evaluation = jdbc.queryForList(
                "SELECT room_id, evaluator_id, target_id, score, comment FROM evaluation WHERE id = ?", evaluationId)
                .stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "평가를 찾을 수 없어요"));
        if (((Number) evaluation.get("target_id")).longValue() != userId) {
            throw new ApiException(HttpStatus.FORBIDDEN, "내가 받은 평가에만 항의할 수 있어요");
        }
        Integer pending = jdbc.queryForObject(
                "SELECT COUNT(*) FROM evaluation_appeal WHERE evaluation_id = ? AND status = 'PENDING'",
                Integer.class, evaluationId);
        if (pending != null && pending > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "이미 검토 중인 항의가 있어요");
        }
        jdbc.update("""
                INSERT INTO evaluation_appeal (evaluation_id, room_id, evaluator_id, target_id, score, comment, reason)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, evaluationId, evaluation.get("room_id"), evaluation.get("evaluator_id"), userId,
                evaluation.get("score"), evaluation.get("comment"), text);
    }

    static List<String> validReasons(List<String> reasons) {
        List<String> picked = reasons == null ? List.of() : reasons.stream().distinct().toList();
        if (picked.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "신고 이유를 하나 이상 골라 주세요");
        }
        if (!REASONS.containsAll(picked)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "없는 신고 이유가 들어 있어요");
        }
        return picked;
    }

    private void requireBothMembers(Long roomId, long reporterId, long targetId) {
        if (roomId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "팀 채팅 신고에는 방 번호가 필요해요");
        }
        Integer members = jdbc.queryForObject(
                "SELECT COUNT(*) FROM room_member WHERE room_id = ? AND user_id IN (?, ?)",
                Integer.class, roomId, reporterId, targetId);
        if (members == null || members < 2) {
            throw new ApiException(HttpStatus.FORBIDDEN, "같은 팀 팀원만 채팅에서 신고할 수 있어요");
        }
    }

    private static Object[] prepend(Object first, Object[] rest) {
        Object[] all = new Object[rest.length + 1];
        all[0] = first;
        System.arraycopy(rest, 0, all, 1, rest.length);
        return all;
    }
}
