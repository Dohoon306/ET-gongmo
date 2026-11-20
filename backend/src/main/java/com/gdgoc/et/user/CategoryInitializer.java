package com.gdgoc.et.user;

import java.util.HashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CategoryInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    static final String LINK_CATEGORY_TO_FIELD = """
            INSERT IGNORE INTO category_field (category_id, field_id)
            SELECT c.id, f.id FROM category c JOIN category f ON f.code = ? WHERE c.code = ?
            """;

    @Override
    public void run(ApplicationArguments args) {
        int inserted = insertMissingCategories();
        if (inserted > 0) {
            log.info("category 테이블에 빠진 행 {}개를 채웠습니다", inserted);
        }
    }

    public int insertMissingCategories() {
        Set<Long> existingIds = new HashSet<>(jdbcTemplate.queryForList("SELECT id FROM category", Long.class));
        Set<String> existingCodes = new HashSet<>(jdbcTemplate.queryForList("SELECT code FROM category", String.class));
        int inserted = 0;
        for (CategorySeed seed : CategoryCatalog.ALL) {
            if (existingIds.contains(seed.id())) {
                continue;
            }
            if (existingCodes.contains(seed.code())) {
                log.warn("category 코드 {}가 고정 ID {}가 아닌 다른 ID로 들어 있어 건너뜁니다", seed.code(), seed.id());
                continue;
            }
            inserted += jdbcTemplate.update(
                    "INSERT INTO category (id, axis, code, name, sort_order) VALUES (?, ?, ?, ?, ?)",
                    seed.id(), seed.axis().name(), seed.code(), seed.name(), seed.sortOrder());
        }
        linkCategoriesToFields();
        return inserted;
    }

    private void linkCategoriesToFields() {
        for (CategorySeed seed : CategoryCatalog.ALL) {
            for (String fieldCode : CategoryCatalog.fieldCodesOf(seed.code())) {
                jdbcTemplate.update(LINK_CATEGORY_TO_FIELD, fieldCode, seed.code());
            }
        }
    }
}
