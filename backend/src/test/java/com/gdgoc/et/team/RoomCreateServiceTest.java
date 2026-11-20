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
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementCreator;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.support.KeyHolder;

class RoomCreateServiceTest {

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final NamedParameterJdbcTemplate named = mock(NamedParameterJdbcTemplate.class);
    private final RoomCreateService service = new RoomCreateService(jdbc, named);

    private RoomCreateService.NewRoom room(int capacity, List<Long> categoryIds) {
        return new RoomCreateService.NewRoom(33L, "백엔드 같이 해요", null, capacity, categoryIds);
    }

    @Test
    void rejectsCapacityOutsideRange() {
        assertThatThrownBy(() -> service.create(1L, room(1, List.of(1L)))).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> service.create(1L, room(11, List.of(1L)))).isInstanceOf(ApiException.class);
        verify(jdbc, never()).update(any(PreparedStatementCreator.class), any(KeyHolder.class));
    }

    @Test
    void readsContestFieldIdsFromCommaSeparatedColumn() {
        assertThat(RoomCreateService.idsIn("1,3")).containsExactly(1L, 3L);
        assertThat(RoomCreateService.idsIn(null)).isEmpty();
        assertThat(RoomCreateService.idsIn("")).isEmpty();
    }

    @Test
    void rejectsEmptyTags() {
        assertThatThrownBy(() -> service.create(1L, room(3, List.of()))).isInstanceOf(ApiException.class);
    }

    @Test
    void rejectsMissingContest() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(33L))).thenReturn(0);
        assertThatThrownBy(() -> service.create(1L, room(3, List.of(1L))))
                .isInstanceOf(ApiException.class).hasMessageContaining("공모전");
    }

    @Test
    void rejectsUnknownTag() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(33L))).thenReturn(1);
        when(named.queryForObject(anyString(), any(SqlParameterSource.class), eq(Integer.class))).thenReturn(1);
        assertThatThrownBy(() -> service.create(1L, room(3, List.of(1L, 999L))))
                .isInstanceOf(ApiException.class).hasMessageContaining("태그");
        verify(jdbc, never()).update(any(PreparedStatementCreator.class), any(KeyHolder.class));
    }
}
