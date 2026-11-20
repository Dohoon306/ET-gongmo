package com.gdgoc.et.user;

import com.gdgoc.et.common.error.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDeletionService {

    private final JdbcTemplate jdbc;

    @Transactional
    public void delete(long userId) {
        if (count("SELECT COUNT(*) FROM users WHERE id = ?", userId) == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없어요");
        }
        if (count("SELECT COUNT(*) FROM admin_account WHERE user_id = ?", userId) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "관리자 계정은 지울 수 없어요");
        }
        deleteHostedRooms(userId);
        leaveJoinedRooms(userId);
        jdbc.update("DELETE FROM evaluation_appeal WHERE evaluator_id = ? OR target_id = ?", userId, userId);
        jdbc.update("DELETE FROM evaluation WHERE evaluator_id = ? OR target_id = ?", userId, userId);
        jdbc.update("DELETE FROM join_request WHERE user_id = ?", userId);
        jdbc.update("DELETE FROM chat_read WHERE user_id = ?", userId);
        jdbc.update("DELETE FROM chat_message WHERE sender_id = ? OR receiver_id = ?", userId, userId);
        jdbc.update("DELETE FROM users WHERE id = ?", userId);
    }

    private void deleteHostedRooms(long userId) {
        jdbc.update("DELETE FROM evaluation_appeal WHERE room_id IN (SELECT id FROM room WHERE host_id = ?)", userId);
        jdbc.update("DELETE FROM room WHERE host_id = ?", userId);
    }

    private void leaveJoinedRooms(long userId) {
        jdbc.update("""
                UPDATE room SET status = 'RECRUITING'
                WHERE status = 'FULL' AND id IN (SELECT room_id FROM room_member WHERE user_id = ?)
                """, userId);
        jdbc.update("DELETE FROM room_member WHERE user_id = ?", userId);
    }

    private int count(String sql, long userId) {
        Integer found = jdbc.queryForObject(sql, Integer.class, userId);
        return found == null ? 0 : found;
    }
}
