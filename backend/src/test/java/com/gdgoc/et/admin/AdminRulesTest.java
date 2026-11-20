package com.gdgoc.et.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.gdgoc.et.common.error.ApiException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

class AdminRulesTest {

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final AdminService admin = new AdminService(jdbc, mock(NamedParameterJdbcTemplate.class));
    private final ReportService reports = new ReportService(jdbc);

    private static HttpStatus statusOf(Throwable e) {
        return ((ApiException) e).getStatus();
    }

    @Test
    void nonAdminIsForbidden() {
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(5L))).thenReturn(0);
        assertThatThrownBy(() -> admin.requireAdmin(5L)).satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> admin.requireAdmin(null)).isInstanceOf(ApiException.class);
    }

    @Test
    void reportNeedsKnownReasonsAndDetailForEtc() {
        assertThatThrownBy(() -> ReportService.validReasons(List.of())).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> ReportService.validReasons(List.of("SPAM"))).isInstanceOf(ApiException.class);
        assertThat(ReportService.validReasons(List.of("AD", "ABUSE", "AD"))).containsExactly("AD", "ABUSE");

        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(2L))).thenReturn(1);
        assertThatThrownBy(() -> reports.report(1L, new ReportService.ReportInput(2L, List.of("ETC"), " ", "PROFILE", null)))
                .hasMessageContaining("기타");
        assertThatThrownBy(() -> reports.report(1L, new ReportService.ReportInput(1L, List.of("AD"), null, "PROFILE", null)))
                .hasMessageContaining("나 자신");
    }

    @Test
    void appealOnlyForOwnEvaluationWithReason() {
        assertThatThrownBy(() -> reports.appeal(6L, 1L, "  ")).hasMessageContaining("이유");

        when(jdbc.queryForList(anyString(), eq(1L))).thenReturn(List.of(Map.of(
                "room_id", 5L, "evaluator_id", 1L, "target_id", 6L, "score", 2, "comment", "별로")));
        assertThatThrownBy(() -> reports.appeal(7L, 1L, "억울해요"))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void contestNeedsTitleAndOrderedDates() {
        AdminService.ContestInput noTitle = new AdminService.ContestInput(" ", null, null, null, null, null, null, null,
                null, null, null);
        assertThatThrownBy(() -> AdminService.clean(noTitle)).hasMessageContaining("제목");

        AdminService.ContestInput backwards = new AdminService.ContestInput("공모전", null, null, LocalDate.of(2026, 12, 1),
                LocalDate.of(2026, 11, 1), null, null, null, null, null, List.of(1L, 1L));
        assertThatThrownBy(() -> AdminService.clean(backwards)).hasMessageContaining("마감일");

        AdminService.ContestInput ok = new AdminService.ContestInput(" 공모전 ", "공모전", "", null, null, null, null, null,
                null, null, List.of(1L, 1L));
        AdminService.ContestInput cleaned = AdminService.clean(ok);
        assertThat(cleaned.title()).isEqualTo("공모전");
        assertThat(cleaned.host()).isNull();
        assertThat(cleaned.categoryIds()).containsExactly(1L);
    }

    @Test
    void closingRoomRejectsPendingRequestsAndRefusesTwice() {
        when(jdbc.queryForList(anyString(), eq(String.class), eq(3L))).thenReturn(List.of("RECRUITING"));
        admin.closeRoom(3L);
        org.mockito.Mockito.verify(jdbc).update("UPDATE room SET status = 'CLOSED' WHERE id = ?", 3L);
        org.mockito.Mockito.verify(jdbc).update(org.mockito.ArgumentMatchers.contains("status = 'REJECTED'"), eq(3L));

        when(jdbc.queryForList(anyString(), eq(String.class), eq(5L))).thenReturn(List.of("CLOSED"));
        assertThatThrownBy(() -> admin.closeRoom(5L)).satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT));

        when(jdbc.queryForList(anyString(), eq(String.class), eq(9L))).thenReturn(List.of());
        assertThatThrownBy(() -> admin.closeRoom(9L)).satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void suspendedHeaderParsing() {
        assertThat(SuspensionInterceptor.parseUserId(" 12 ")).isEqualTo(12L);
        assertThat(SuspensionInterceptor.parseUserId("abc")).isNull();
        assertThat(SuspensionInterceptor.parseUserId(null)).isNull();
    }
}
