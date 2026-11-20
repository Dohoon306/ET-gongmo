package com.gdgoc.et.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gdgoc.et.common.error.ApiException;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;

class ProfileEditServiceTest {

    private static final long USER = 4L;
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 21, 12, 0);

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final ProfileEditService service = new ProfileEditService(jdbc,
            Clock.fixed(Instant.parse("2026-11-21T03:00:00Z"), ZoneId.of("Asia/Seoul")));

    @BeforeEach
    void user() {
        when(jdbc.queryForList(contains("FOR UPDATE"), eq(String.class), eq(USER))).thenReturn(List.of("방장 박"));
        when(jdbc.queryForList(contains("SELECT name, intro"), eq(USER)))
                .thenReturn(List.of(Map.of("name", "박", "intro", "소개")));
    }

    private void lastNameChange(LocalDateTime changedAt) {
        when(jdbc.queryForList(contains("FROM user_name_change"), eq(Timestamp.class), eq(USER)))
                .thenReturn(List.of(Timestamp.valueOf(changedAt)));
    }

    private static HttpStatus statusOf(Throwable e) {
        return ((ApiException) e).getStatus();
    }

    @Test
    void firstNameChangeIsAllowedAndRecorded() {
        service.changeName(USER, "  박서준 ");

        verify(jdbc).update("UPDATE users SET name = ? WHERE id = ?", "박서준", USER);
        verify(jdbc).update(contains("INSERT INTO user_name_change"), eq(USER), eq(NOW));
    }

    @Test
    void nameCanChangeOnlyOncePerMonth() {
        lastNameChange(LocalDateTime.of(2026, 10, 21, 12, 0, 1));

        assertThatThrownBy(() -> service.changeName(USER, "새 이름"))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT))
                .hasMessageContaining("한 달에 한 번")
                .hasMessageContaining("11월 21일 12:00");
        verify(jdbc, never()).update(eq("UPDATE users SET name = ? WHERE id = ?"), any(), any());
    }

    @Test
    void nameCanChangeAgainExactlyOneMonthLater() {
        lastNameChange(LocalDateTime.of(2026, 10, 21, 12, 0));

        service.changeName(USER, "새 이름");

        verify(jdbc).update("UPDATE users SET name = ? WHERE id = ?", "새 이름", USER);
    }

    @Test
    void lockedAccountShowsWhenNameCanChange() {
        lastNameChange(LocalDateTime.of(2026, 11, 1, 9, 30));

        assertThat(service.me(USER).nameChangeAvailableAt()).isEqualTo(LocalDateTime.of(2026, 12, 1, 9, 30));
    }

    @Test
    void rejectsBlankTooLongOrSameName() {
        assertThatThrownBy(() -> service.changeName(USER, "  ")).hasMessageContaining("입력");
        assertThatThrownBy(() -> service.changeName(USER, "가".repeat(31))).hasMessageContaining("30자");
        assertThatThrownBy(() -> service.changeName(USER, "방장 박")).hasMessageContaining("같아요");
        verify(jdbc, never()).update(eq("UPDATE users SET name = ? WHERE id = ?"), any(), any());
    }

    @Test
    void introMustNotBeBlankOrTooLong() {
        assertThatThrownBy(() -> service.changeIntro(USER, " ")).hasMessageContaining("입력");
        assertThatThrownBy(() -> service.changeIntro(USER, "가".repeat(1001))).hasMessageContaining("1000자");
        when(jdbc.update("UPDATE users SET intro = ? WHERE id = ?", "Java 백엔드 공부 중", USER)).thenReturn(1);
        assertThat(service.changeIntro(USER, " Java 백엔드 공부 중 ").name()).isEqualTo("박");
    }

    @Test
    void unknownUserIsNotFound() {
        when(jdbc.queryForList(contains("FOR UPDATE"), eq(String.class), eq(99L))).thenReturn(List.of());
        assertThatThrownBy(() -> service.changeName(99L, "이름"))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.NOT_FOUND));
        verify(jdbc, never()).update(anyString(), eq("이름"), eq(99L));
    }
}
