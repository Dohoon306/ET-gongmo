package com.gdgoc.et.team;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

class TeamSeedContributorTest {

    private static final long HERO_GONGMOA_ID = 100049285L;

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);

    @Test
    void failsClearlyWithoutHeroGongmoaId() {
        assertThatThrownBy(() -> new TeamSeedContributor(jdbc, 0).seed())
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("HERO_GONGMOA_ID");
        verify(jdbc, never()).update(anyString(), any(Object[].class));
    }

    @Test
    void failsClearlyWhenHeroContestIsMissing() {
        when(jdbc.queryForObject(anyString(), eq(Long.class), eq(HERO_GONGMOA_ID)))
                .thenThrow(new EmptyResultDataAccessException(1));
        assertThatThrownBy(() -> new TeamSeedContributor(jdbc, HERO_GONGMOA_ID).seed())
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("공모전 시드");
    }

    @Test
    void insertsFiveRoomsWithTagsAndMembers() {
        when(jdbc.queryForObject(anyString(), eq(Long.class), any(Object[].class))).thenReturn(33L);

        new TeamSeedContributor(jdbc, HERO_GONGMOA_ID).seed();

        verify(jdbc, times(5)).update(eq("""
                INSERT INTO room (id, contest_id, host_id, title, intro, capacity, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """), any(Object[].class));
        verify(jdbc, times(18)).update(eq("INSERT INTO room_category (room_id, category_id) VALUES (?, ?)"),
                any(Object[].class));
        verify(jdbc, times(8)).update(
                eq("INSERT INTO room_member (room_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)"),
                any(Object[].class));
    }

    @Test
    void demoRoomsMatchTheDemoData() {
        List<TeamSeedContributor.SeedRoom> rooms = TeamSeedContributor.SEED_ROOMS;
        List<String> heroLike = List.of("it", "backend", "java", "beginner", "learn");

        assertThat(rooms).extracting(r -> r.categoryCodes().stream().filter(heroLike::contains).count())
                .containsExactly(5L, 3L, 2L, 1L, 0L);
        assertThat(rooms.subList(0, 4)).isSortedAccordingTo((a, b) -> b.createdAt().compareTo(a.createdAt()));
        assertThat(rooms.get(0).members()).hasSize(2);
        assertThat(rooms.get(4).status()).isEqualTo("CLOSED");
        assertThat(rooms.get(4).heroContest()).isFalse();
        assertThat(rooms.get(4).members()).extracting(TeamSeedContributor.SeedMember::userId)
                .containsExactlyInAnyOrder(2L, 7L, 8L);
    }
}
