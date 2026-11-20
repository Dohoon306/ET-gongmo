package com.gdgoc.et.team;

import com.gdgoc.et.common.error.ApiException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChatService {

    static final int MAX_CONTENT = 1000;
    static final int PAGE_SIZE = 200;

    private static final String MESSAGE_COLUMNS = """
            m.id, m.sender_id, u.name AS sender_name, m.content,
            DATE_FORMAT(m.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at,
            EXISTS (SELECT 1 FROM room_event e WHERE e.message_id = m.id) AS notice
            """;

    private final JdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate named;

    public record Message(long id, long senderId, String senderName, String content, String createdAt, boolean mine,
                          boolean notice) {}

    public record RoomUnread(long roomId, String title, long unread, String lastContent) {}

    public record Conversation(long peerId, String peerName, String lastContent, String lastAt, long unread) {}

    public record Unread(long total, long direct, List<RoomUnread> rooms) {}

    @Transactional
    public List<Message> roomMessages(long roomId, long userId, long afterId) {
        requireMember(roomId, userId);
        List<Message> messages = latestFirst(jdbc.query(
                "SELECT " + MESSAGE_COLUMNS + " FROM chat_message m JOIN users u ON u.id = m.sender_id "
                        + "WHERE m.room_id = ? AND m.id > ? ORDER BY m.id DESC LIMIT " + PAGE_SIZE,
                (rs, i) -> toMessage(rs, userId), roomId, afterId));
        jdbc.update("""
                INSERT INTO chat_read (room_id, user_id, last_read_id)
                VALUES (?, ?, (SELECT COALESCE(MAX(id), 0) FROM chat_message WHERE room_id = ?))
                ON DUPLICATE KEY UPDATE last_read_id = VALUES(last_read_id)
                """, roomId, userId, roomId);
        return messages;
    }

    @Transactional
    public void sendRoomMessage(long roomId, long userId, String content) {
        requireMember(roomId, userId);
        jdbc.update("INSERT INTO chat_message (room_id, sender_id, content) VALUES (?, ?, ?)",
                roomId, userId, cleanContent(content));
    }

    @Transactional
    public List<Message> directMessages(long userId, long peerId, long afterId) {
        requirePeer(userId, peerId);
        List<Message> messages = latestFirst(jdbc.query(
                "SELECT " + MESSAGE_COLUMNS + " FROM chat_message m JOIN users u ON u.id = m.sender_id "
                        + "WHERE m.room_id IS NULL AND m.id > ? "
                        + "AND ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)) "
                        + "ORDER BY m.id DESC LIMIT " + PAGE_SIZE,
                (rs, i) -> toMessage(rs, userId), afterId, userId, peerId, peerId, userId));
        jdbc.update("UPDATE chat_message SET read_at = NOW() WHERE receiver_id = ? AND sender_id = ? AND read_at IS NULL",
                userId, peerId);
        return messages;
    }

    @Transactional
    public void sendDirectMessage(long userId, long peerId, String content) {
        requirePeer(userId, peerId);
        jdbc.update("INSERT INTO chat_message (sender_id, receiver_id, content) VALUES (?, ?, ?)",
                userId, peerId, cleanContent(content));
    }

    public List<Conversation> conversations(long userId) {
        return named.query("""
                SELECT p.peer_id, u.name AS peer_name, m.content AS last_content,
                       DATE_FORMAT(m.created_at, '%Y-%m-%dT%H:%i:%s') AS last_at,
                       (SELECT COUNT(*) FROM chat_message x
                        WHERE x.receiver_id = :me AND x.sender_id = p.peer_id AND x.read_at IS NULL) AS unread
                FROM (SELECT CASE WHEN sender_id = :me THEN receiver_id ELSE sender_id END AS peer_id, MAX(id) AS last_id
                      FROM chat_message
                      WHERE room_id IS NULL AND (sender_id = :me OR receiver_id = :me)
                      GROUP BY peer_id) p
                JOIN chat_message m ON m.id = p.last_id
                JOIN users u ON u.id = p.peer_id
                ORDER BY p.last_id DESC
                """, Map.of("me", userId), (rs, i) -> new Conversation(rs.getLong("peer_id"), rs.getString("peer_name"),
                rs.getString("last_content"), rs.getString("last_at"), rs.getLong("unread")));
    }

    public Unread unread(long userId) {
        List<RoomUnread> rooms = named.query("""
                SELECT r.id, r.title,
                       (SELECT COUNT(*) FROM chat_message c
                        WHERE c.room_id = r.id AND c.sender_id <> :me
                          AND c.id > COALESCE((SELECT cr.last_read_id FROM chat_read cr
                                               WHERE cr.room_id = r.id AND cr.user_id = :me), 0)) AS unread,
                       (SELECT c.content FROM chat_message c WHERE c.room_id = r.id ORDER BY c.id DESC LIMIT 1) AS last_content
                FROM room_member m
                JOIN room r ON r.id = m.room_id
                WHERE m.user_id = :me
                ORDER BY m.joined_at DESC, r.id DESC
                """, Map.of("me", userId), (rs, i) -> new RoomUnread(rs.getLong("id"), rs.getString("title"),
                rs.getLong("unread"), rs.getString("last_content")));
        Long direct = jdbc.queryForObject(
                "SELECT COUNT(*) FROM chat_message WHERE receiver_id = ? AND read_at IS NULL", Long.class, userId);
        long directCount = direct == null ? 0 : direct;
        long total = directCount + rooms.stream().mapToLong(RoomUnread::unread).sum();
        return new Unread(total, directCount, rooms);
    }

    private void requireMember(long roomId, long userId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM room_member WHERE room_id = ? AND user_id = ?",
                Integer.class, roomId, userId);
        if (count == null || count == 0) {
            throw new ApiException(HttpStatus.FORBIDDEN, "이 팀의 팀원만 채팅할 수 있어요");
        }
    }

    private void requirePeer(long userId, long peerId) {
        if (userId == peerId) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "나에게는 쪽지를 보낼 수 없어요");
        }
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE id = ?", Integer.class, peerId);
        if (count == null || count == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없어요");
        }
    }

    static String cleanContent(String content) {
        String text = content == null ? "" : content.strip();
        if (text.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "내용을 입력해 주세요");
        }
        if (text.length() > MAX_CONTENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "메시지는 " + MAX_CONTENT + "자까지 보낼 수 있어요");
        }
        return text;
    }

    private static Message toMessage(ResultSet rs, long userId) throws SQLException {
        long senderId = rs.getLong("sender_id");
        return new Message(rs.getLong("id"), senderId, rs.getString("sender_name"), rs.getString("content"),
                rs.getString("created_at"), senderId == userId, rs.getBoolean("notice"));
    }

    private static List<Message> latestFirst(List<Message> newestFirst) {
        List<Message> ordered = new ArrayList<>(newestFirst);
        Collections.reverse(ordered);
        return ordered;
    }
}
