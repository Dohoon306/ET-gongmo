package com.gdgoc.et.team;

import com.gdgoc.et.common.error.ApiException;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoomCreateService {

    static final int MIN_CAPACITY = 2;
    static final int MAX_CAPACITY = 10;

    private final JdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate named;

    public record NewRoom(Long contestId, String title, String intro, int capacity, List<Long> categoryIds) {}

    public record ContestOption(Long id, String title, String type, String endDate, List<Long> fieldIds) {}

    public List<ContestOption> openContests() {
        return jdbc.query("""
                SELECT c.id, c.title, c.type, c.end_date,
                       (SELECT GROUP_CONCAT(cc.category_id ORDER BY cc.category_id)
                        FROM contest_category cc JOIN category f ON f.id = cc.category_id
                        WHERE cc.contest_id = c.id AND f.axis = 'FIELD') AS field_ids
                FROM contest c
                WHERE c.end_date IS NULL OR c.end_date >= CURRENT_DATE
                ORDER BY c.end_date IS NULL, c.end_date, c.id
                """, (rs, i) -> new ContestOption(rs.getLong("id"), rs.getString("title"), rs.getString("type"),
                rs.getString("end_date"), idsIn(rs.getString("field_ids"))));
    }

    static List<Long> idsIn(String commaSeparatedIds) {
        if (commaSeparatedIds == null || commaSeparatedIds.isBlank()) {
            return List.of();
        }
        return Arrays.stream(commaSeparatedIds.split(",")).map(Long::valueOf).toList();
    }

    @Transactional
    public Long create(Long hostId, NewRoom room) {
        List<Long> categoryIds = room.categoryIds() == null ? List.of() : room.categoryIds().stream().distinct().toList();
        validate(room, categoryIds);

        KeyHolder key = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO room (contest_id, host_id, title, intro, capacity) VALUES (?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, room.contestId());
            ps.setLong(2, hostId);
            ps.setString(3, room.title().strip());
            ps.setString(4, room.intro() == null || room.intro().isBlank() ? null : room.intro().strip());
            ps.setInt(5, room.capacity());
            return ps;
        }, key);
        Long roomId = key.getKey().longValue();

        jdbc.update("INSERT INTO room_member (room_id, user_id, role) VALUES (?, ?, 'HOST')", roomId, hostId);
        jdbc.batchUpdate("INSERT INTO room_category (room_id, category_id) VALUES (?, ?)",
                categoryIds.stream().map(id -> new Object[] {roomId, id}).toList());
        return roomId;
    }

    private void validate(NewRoom room, List<Long> categoryIds) {
        if (room.capacity() < MIN_CAPACITY || room.capacity() > MAX_CAPACITY) {
            throw badRequest("정원은 방장을 포함해 " + MIN_CAPACITY + "~" + MAX_CAPACITY + "명이에요");
        }
        if (categoryIds.isEmpty()) {
            throw badRequest("원하는 팀원 태그를 1개 이상 골라 주세요");
        }
        Integer contests = jdbc.queryForObject("SELECT COUNT(*) FROM contest WHERE id = ?", Integer.class, room.contestId());
        if (contests == null || contests == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "공모전을 찾을 수 없어요");
        }
        Integer known = named.queryForObject("SELECT COUNT(*) FROM category WHERE id IN (:ids)",
                new MapSqlParameterSource("ids", categoryIds), Integer.class);
        if (known == null || known != categoryIds.size()) {
            throw badRequest("없는 태그가 들어 있어요");
        }
    }

    private static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }
}
