package com.gdgoc.et.team;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gdgoc.et.common.error.ApiException;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class TeamServiceTest {

    private final RoomRepository rooms = mock(RoomRepository.class);
    private final RoomMemberRepository members = mock(RoomMemberRepository.class);
    private final JoinRequestRepository requests = mock(JoinRequestRepository.class);
    private final TeamService service = new TeamService(rooms, members, requests);

    private Room room(long hostId, int capacity) {
        Room room = new Room();
        ReflectionTestUtils.setField(room, "id", 1L);
        ReflectionTestUtils.setField(room, "hostId", hostId);
        ReflectionTestUtils.setField(room, "capacity", capacity);
        ReflectionTestUtils.setField(room, "status", Room.Status.RECRUITING);
        return room;
    }

    @Test
    void acceptingLastSeatMakesRoomFullAndRejectsOthers() {
        Room room = room(1L, 3);
        JoinRequest mine = new JoinRequest(1L, 8L, "hi");
        JoinRequest other = new JoinRequest(1L, 9L, "hello");
        when(requests.findById(10L)).thenReturn(Optional.of(mine));
        when(rooms.findForUpdate(1L)).thenReturn(Optional.of(room));
        when(members.countByRoomId(1L)).thenReturn(3L);
        when(requests.findByRoomIdAndStatus(1L, JoinRequest.Status.PENDING)).thenReturn(List.of(other));

        service.accept(10L, 1L);

        assertThat(mine.getStatus()).isEqualTo(JoinRequest.Status.ACCEPTED);
        assertThat(room.getStatus()).isEqualTo(Room.Status.FULL);
        assertThat(other.getStatus()).isEqualTo(JoinRequest.Status.REJECTED);
    }

    @Test
    void acceptingBelowCapacityKeepsRecruiting() {
        Room room = room(1L, 4);
        when(requests.findById(10L)).thenReturn(Optional.of(new JoinRequest(1L, 8L, "hi")));
        when(rooms.findForUpdate(1L)).thenReturn(Optional.of(room));
        when(members.countByRoomId(1L)).thenReturn(2L);

        service.accept(10L, 1L);

        assertThat(room.getStatus()).isEqualTo(Room.Status.RECRUITING);
    }

    @Test
    void onlyHostCanAccept() {
        when(requests.findById(10L)).thenReturn(Optional.of(new JoinRequest(1L, 8L, "hi")));
        when(rooms.findForUpdate(1L)).thenReturn(Optional.of(room(1L, 3)));

        assertThatThrownBy(() -> service.accept(10L, 5L)).isInstanceOf(ApiException.class);
        verify(members, never()).save(any());
    }
}
