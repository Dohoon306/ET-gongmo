package com.gdgoc.et.team;

import com.gdgoc.et.common.error.ApiException;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoomManageService {

    static final int MAX_REASON = 200;

    private final JdbcTemplate jdbc;

    record RoomState(long hostId, String status, int capacity) {}

    @Transactional
    public void kick(long roomId, long hostId, long targetId, String reason) {
        String cleanReason = reason == null ? "" : reason.strip();
        if (cleanReason.isEmpty()) {
            throw badRequest("강퇴 사유를 적어 주세요");
        }
        if (cleanReason.length() > MAX_REASON) {
            throw badRequest("강퇴 사유는 " + MAX_REASON + "자까지 쓸 수 있어요");
        }
        RoomState room = lockOpenRoom(roomId);
        requireHost(room, hostId);
        if (targetId == hostId) {
            throw badRequest("방장은 자기 자신을 강퇴할 수 없어요");
        }
        requireMember(roomId, targetId);
        jdbc.update("DELETE FROM room_member WHERE room_id = ? AND user_id = ?", roomId, targetId);
        reopenIfFull(roomId, room);
        String name = nameOf(targetId);
        long messageId = notice(roomId, hostId, name + " 님이 강퇴되었습니다. 사유: " + cleanReason);
        record(roomId, hostId, targetId, "KICK", cleanReason, messageId);
    }

    @Transactional
    public void leave(long roomId, long userId) {
        RoomState room = lockOpenRoom(roomId);
        if (room.hostId() == userId) {
            throw conflict("방장은 다른 팀원에게 방장을 넘기거나, 혼자 남았을 때 방을 지울 수 있어요");
        }
        requireMember(roomId, userId);
        jdbc.update("DELETE FROM room_member WHERE room_id = ? AND user_id = ?", roomId, userId);
        reopenIfFull(roomId, room);
        long messageId = notice(roomId, userId, nameOf(userId) + " 님이 방을 나갔습니다.");
        record(roomId, userId, userId, "LEAVE", null, messageId);
    }

    @Transactional
    public void transferHost(long roomId, long hostId, long newHostId) {
        RoomState room = lockOpenRoom(roomId);
        requireHost(room, hostId);
        if (newHostId == hostId) {
            throw badRequest("이미 방장이에요");
        }
        requireMember(roomId, newHostId);
        jdbc.update("UPDATE room_member SET role = 'MEMBER' WHERE room_id = ? AND user_id = ?", roomId, hostId);
        jdbc.update("UPDATE room_member SET role = 'HOST' WHERE room_id = ? AND user_id = ?", roomId, newHostId);
        jdbc.update("UPDATE room SET host_id = ? WHERE id = ?", newHostId, roomId);
        long messageId = notice(roomId, hostId, nameOf(newHostId) + " 님이 새 방장이 되었습니다.");
        record(roomId, hostId, newHostId, "HOST_CHANGE", null, messageId);
    }

    @Transactional
    public void deleteRoom(long roomId, long hostId) {
        RoomState room = lockRoom(roomId);
        requireHost(room, hostId);
        Integer others = jdbc.queryForObject("SELECT COUNT(*) FROM room_member WHERE room_id = ? AND user_id <> ?",
                Integer.class, roomId, hostId);
        if (others != null && others > 0) {
            throw conflict("팀원이 남아 있으면 방을 지울 수 없어요. 팀원이 모두 나가거나 강퇴한 뒤 지워 주세요");
        }
        jdbc.update("DELETE FROM room WHERE id = ?", roomId);
    }

    private RoomState lockOpenRoom(long roomId) {
        RoomState room = lockRoom(roomId);
        if ("CLOSED".equals(room.status())) {
            throw conflict("종료된 팀은 팀원을 바꿀 수 없어요");
        }
        return room;
    }

    private RoomState lockRoom(long roomId) {
        Map<String, Object> row = jdbc.queryForList(
                        "SELECT host_id, status, capacity FROM room WHERE id = ? FOR UPDATE", roomId)
                .stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "방을 찾을 수 없어요"));
        return new RoomState(((Number) row.get("host_id")).longValue(), (String) row.get("status"),
                ((Number) row.get("capacity")).intValue());
    }

    private static void requireHost(RoomState room, long userId) {
        if (room.hostId() != userId) {
            throw new ApiException(HttpStatus.FORBIDDEN, "방장만 할 수 있어요");
        }
    }

    private void requireMember(long roomId, long userId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM room_member WHERE room_id = ? AND user_id = ?",
                Integer.class, roomId, userId);
        if (count == null || count == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "이 방의 팀원이 아니에요");
        }
    }

    private void reopenIfFull(long roomId, RoomState room) {
        if ("FULL".equals(room.status())) {
            jdbc.update("UPDATE room SET status = 'RECRUITING' WHERE id = ?", roomId);
        }
    }

    private String nameOf(long userId) {
        return jdbc.queryForList("SELECT name FROM users WHERE id = ?", String.class, userId)
                .stream().findFirst().orElse("팀원");
    }

    private long notice(long roomId, long senderId, String content) {
        GeneratedKeyHolder key = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO chat_message (room_id, sender_id, content) VALUES (?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, roomId);
            ps.setLong(2, senderId);
            ps.setString(3, content.length() > ChatService.MAX_CONTENT ? content.substring(0, ChatService.MAX_CONTENT) : content);
            return ps;
        }, key);
        return key.getKey().longValue();
    }

    private void record(long roomId, long actorId, long userId, String kind, String reason, long messageId) {
        jdbc.update("""
                INSERT INTO room_event (room_id, actor_id, user_id, kind, reason, message_id)
                VALUES (?, ?, ?, ?, ?, ?)
                """, roomId, actorId, userId, kind, reason, messageId);
    }

    private static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    private static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }
}
