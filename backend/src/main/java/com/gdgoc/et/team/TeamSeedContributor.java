package com.gdgoc.et.team;

import com.gdgoc.et.common.seed.SeedContributor;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(3)
public class TeamSeedContributor implements SeedContributor {

    record SeedMember(long userId, String role, LocalDateTime joinedAt) {}

    record SeedRoom(long id, boolean heroContest, long hostId, String title, String intro, int capacity,
                    String status, LocalDateTime createdAt, List<String> categoryCodes, List<SeedMember> members) {}

    static final LocalDateTime RECRUITING_BASE = LocalDateTime.of(2026, 11, 20, 12, 0);
    static final LocalDateTime LAST_YEAR = LocalDateTime.of(2025, 11, 20, 12, 0);

    static final List<SeedRoom> SEED_ROOMS = List.of(
            room(1, 2, "초보 환영! 백엔드 같이 배워요",
                    "공공데이터로 체육시설 예약 서비스를 만들어요. Java로 서버를 같이 공부하면서 완성할 분을 찾아요.",
                    3, List.of("it", "backend", "java", "beginner", "learn"), 0,
                    new SeedMember(6, "MEMBER", RECRUITING_BASE.plusMinutes(30))),
            room(2, 3, "Spring 서버 개발자 구합니다",
                    "수상이 목표예요. Spring Boot로 API 서버를 맡아 주실 분을 찾고 있어요.",
                    4, List.of("it", "backend", "java", "spring", "award"), 1),
            room(3, 4, "앱 서비스 같이 만들 분",
                    "Kotlin으로 안드로이드 앱을 만들어요. 처음이어도 괜찮아요.",
                    3, List.of("it", "app", "kotlin", "beginner"), 2),
            room(4, 5, "디자인 강한 팀, 개발자 1명",
                    "디자인은 자신 있어요. 화면을 구현해 줄 개발자 1명을 찾아요.",
                    4, List.of("it", "uiux", "figma", "expert"), 3),
            new SeedRoom(5, false, 2, "작년 캠퍼스 해커톤 팀", null, 3, "CLOSED", LAST_YEAR, List.of(),
                    List.of(new SeedMember(2, "HOST", LAST_YEAR),
                            new SeedMember(7, "MEMBER", LAST_YEAR.plusDays(1)),
                            new SeedMember(8, "MEMBER", LAST_YEAR.plusDays(2)))));

    private final JdbcTemplate jdbc;
    private final long heroGongmoaId;

    public TeamSeedContributor(JdbcTemplate jdbc,
                               @Value("${app.contest-classification.hero-gongmoa-id:0}") long heroGongmoaId) {
        this.jdbc = jdbc;
        this.heroGongmoaId = heroGongmoaId;
    }

    @Override
    @Transactional
    public void seed() {
        Long heroContestId = findHeroContestId();
        for (SeedRoom room : SEED_ROOMS) {
            jdbc.update("""
                    INSERT INTO room (id, contest_id, host_id, title, intro, capacity, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, room.id(), room.heroContest() ? heroContestId : null, room.hostId(), room.title(),
                    room.intro(), room.capacity(), room.status(), Timestamp.valueOf(room.createdAt()));
            for (String code : room.categoryCodes()) {
                jdbc.update("INSERT INTO room_category (room_id, category_id) VALUES (?, ?)",
                        room.id(), categoryIdOf(code));
            }
            for (SeedMember member : room.members()) {
                jdbc.update("INSERT INTO room_member (room_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)",
                        room.id(), member.userId(), member.role(), Timestamp.valueOf(member.joinedAt()));
            }
        }
    }

    private Long findHeroContestId() {
        if (heroGongmoaId <= 0) {
            throw new IllegalStateException("주인공 공모전 번호가 없어요. .env에 HERO_GONGMOA_ID를 넣어 주세요");
        }
        try {
            return jdbc.queryForObject("SELECT id FROM contest WHERE gongmoa_id = ?", Long.class, heroGongmoaId);
        } catch (EmptyResultDataAccessException e) {
            throw new IllegalStateException("주인공 공모전(gongmoa_id " + heroGongmoaId
                    + ")이 contest 테이블에 없어요. 공모전 시드가 먼저 들어가야 해요", e);
        }
    }

    private long categoryIdOf(String code) {
        try {
            return jdbc.queryForObject("SELECT id FROM category WHERE code = ?", Long.class, code);
        } catch (EmptyResultDataAccessException e) {
            throw new IllegalStateException("카테고리 목록에 없는 코드: " + code, e);
        }
    }

    private static SeedRoom room(long id, long hostId, String title, String intro, int capacity,
                                 List<String> categoryCodes, int hoursBeforeNewest, SeedMember... extraMembers) {
        LocalDateTime createdAt = RECRUITING_BASE.minusHours(hoursBeforeNewest);
        List<SeedMember> members = new ArrayList<>();
        members.add(new SeedMember(hostId, "HOST", createdAt));
        members.addAll(List.of(extraMembers));
        return new SeedRoom(id, true, hostId, title, intro, capacity, "RECRUITING", createdAt, categoryCodes,
                List.copyOf(members));
    }
}
