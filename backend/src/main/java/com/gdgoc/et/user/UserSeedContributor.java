package com.gdgoc.et.user;

import com.gdgoc.et.common.seed.SeedContributor;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(1)
@RequiredArgsConstructor
public class UserSeedContributor implements SeedContributor {

    record SeedUser(long id, String name, List<String> categoryCodes) {
    }

    static final List<SeedUser> SEED_USERS = List.of(
            new SeedUser(1, "방장 김", List.of("it", "backend", "java", "experienced", "portfolio")),
            new SeedUser(2, "방장 이", List.of("it", "backend", "spring", "expert", "award")),
            new SeedUser(3, "방장 박", List.of("it", "app", "kotlin", "beginner")),
            new SeedUser(4, "방장 최", List.of("design", "uiux", "figma", "expert")),
            new SeedUser(5, "팀원 정", List.of("it", "frontend", "react", "beginner", "learn")),
            new SeedUser(6, "팀원 한", List.of("it", "frontend", "javascript", "experienced")),
            new SeedUser(7, "새싹(작년)", List.of("it", "backend", "java", "beginner", "learn")));

    static final LocalDateTime SEEDED_AT = LocalDateTime.of(2026, 11, 20, 9, 0);

    private static final Map<String, Long> CATEGORY_ID_BY_CODE = CategoryCatalog.ALL.stream()
            .collect(Collectors.toUnmodifiableMap(CategorySeed::code, CategorySeed::id));

    private final CategoryInitializer categoryInitializer;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void seed() {
        categoryInitializer.insertMissingCategories();
        for (SeedUser user : SEED_USERS) {
            jdbcTemplate.update(
                    "INSERT INTO users (id, name, created_at) VALUES (?, ?, ?)",
                    user.id(), user.name(), Timestamp.valueOf(SEEDED_AT));
            for (String code : user.categoryCodes()) {
                jdbcTemplate.update(
                        "INSERT INTO user_category (user_id, category_id) VALUES (?, ?)",
                        user.id(), categoryIdOf(code));
            }
        }
    }

    static long categoryIdOf(String code) {
        Long id = CATEGORY_ID_BY_CODE.get(code);
        if (id == null) {
            throw new IllegalStateException("카테고리 목록에 없는 코드: " + code);
        }
        return id;
    }
}
