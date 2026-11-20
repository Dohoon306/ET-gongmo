package com.gdgoc.et.team;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gdgoc.et.common.error.ApiException;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;

class RoomManageServiceTest {

    private static final long ROOM = 1L;
    private static final long HOST = 2L;
    private static final long MEMBER = 6L;

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final RoomManageService service = new RoomManageService(jdbc);

    private void room(String status) {
        when(jdbc.queryForList(anyString(), eq(ROOM)))
                .thenReturn(List.of(Map.of("host_id", HOST, "status", status, "capacity", 3)));
    }

    private void members(long userId, int count) {
        when(jdbc.queryForObject(eq("SELECT COUNT(*) FROM room_member WHERE room_id = ? AND user_id = ?"),
                eq(Integer.class), eq(ROOM), eq(userId))).thenReturn(count);
    }

    private static HttpStatus statusOf(Throwable e) {
        return ((ApiException) e).getStatus();
    }

    @Test
    void kickNeedsReasonAndHost() {
        assertThatThrownBy(() -> service.kick(ROOM, HOST, MEMBER, "  ")).hasMessageContaining("사유");
        room("RECRUITING");
        assertThatThrownBy(() -> service.kick(ROOM, MEMBER, HOST, "x"))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> service.kick(ROOM, HOST, HOST, "x")).hasMessageContaining("자기 자신");
        verify(jdbc, never()).update(eq("DELETE FROM room_member WHERE room_id = ? AND user_id = ?"), any(Object[].class));
    }

    @Test
    void kickingFromFullRoomReopensRecruiting() {
        room("FULL");
        members(MEMBER, 1);
        when(jdbc.update(any(org.springframework.jdbc.core.PreparedStatementCreator.class),
                any(org.springframework.jdbc.support.KeyHolder.class))).thenAnswer(call -> {
                    ((org.springframework.jdbc.support.GeneratedKeyHolder) call.getArgument(1)).getKeyList()
                            .add(Map.of("GENERATED_KEY", 99L));
                    return 1;
                });

        service.kick(ROOM, HOST, MEMBER, "연락이 안 돼요");

        verify(jdbc).update("DELETE FROM room_member WHERE room_id = ? AND user_id = ?", ROOM, MEMBER);
        verify(jdbc).update("UPDATE room SET status = 'RECRUITING' WHERE id = ?", ROOM);
        verify(jdbc).update(org.mockito.ArgumentMatchers.contains("INSERT INTO room_event"),
                eq(ROOM), eq(HOST), eq(MEMBER), eq("KICK"), eq("연락이 안 돼요"), eq(99L));
    }

    @Test
    void closedTeamCannotChange() {
        room("CLOSED");
        assertThatThrownBy(() -> service.leave(ROOM, MEMBER))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT));
        assertThatThrownBy(() -> service.transferHost(ROOM, HOST, MEMBER))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void hostCannotLeaveAndMustBeAloneToDelete() {
        room("RECRUITING");
        assertThatThrownBy(() -> service.leave(ROOM, HOST)).hasMessageContaining("방장");

        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(ROOM), eq(HOST))).thenReturn(1);
        assertThatThrownBy(() -> service.deleteRoom(ROOM, HOST)).hasMessageContaining("팀원이 남아");
        assertThatThrownBy(() -> service.deleteRoom(ROOM, MEMBER))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.FORBIDDEN));

        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(ROOM), eq(HOST))).thenReturn(0);
        service.deleteRoom(ROOM, HOST);
        verify(jdbc).update("DELETE FROM room WHERE id = ?", ROOM);
    }

    @Test
    void transferNeedsTargetMember() {
        room("RECRUITING");
        members(9L, 0);
        assertThatThrownBy(() -> service.transferHost(ROOM, HOST, 9L))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.NOT_FOUND));
        assertThatThrownBy(() -> service.transferHost(ROOM, HOST, HOST)).hasMessageContaining("이미 방장");
    }
}
