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
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

class ChatServiceTest {

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final ChatService service = new ChatService(jdbc, mock(NamedParameterJdbcTemplate.class));

    private static HttpStatus statusOf(Throwable e) {
        return ((ApiException) e).getStatus();
    }

    @Test
    void nonMemberCannotReadOrWriteTeamChat() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(1L), eq(9L))).thenReturn(0);

        assertThatThrownBy(() -> service.sendRoomMessage(1L, 9L, "hi"))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> service.roomMessages(1L, 9L, 0L))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.FORBIDDEN));
        verify(jdbc, never()).update(anyString(), any(Object[].class));
    }

    @Test
    void memberMessageIsTrimmedAndSaved() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(1L), eq(2L))).thenReturn(1);

        service.sendRoomMessage(1L, 2L, "  안녕하세요  ");

        verify(jdbc).update("INSERT INTO chat_message (room_id, sender_id, content) VALUES (?, ?, ?)", 1L, 2L, "안녕하세요");
    }

    @Test
    void blankOrTooLongContentIsRejected() {
        assertThatThrownBy(() -> ChatService.cleanContent("   ")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> ChatService.cleanContent(null)).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> ChatService.cleanContent("가".repeat(ChatService.MAX_CONTENT + 1)))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void cannotMessageYourselfOrUnknownUser() {
        assertThatThrownBy(() -> service.sendDirectMessage(3L, 3L, "hi"))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.BAD_REQUEST));

        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(99L))).thenReturn(0);
        assertThatThrownBy(() -> service.sendDirectMessage(3L, 99L, "hi"))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.NOT_FOUND));
    }
}
