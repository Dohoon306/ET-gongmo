package com.gdgoc.et.contest;

import com.gdgoc.et.common.seed.SeedContributor;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(3)
@RequiredArgsConstructor
class ContestSourceLinkSeedContributor implements SeedContributor {

    private final JdbcTemplate jdbcTemplate;

    @Value("${app.contest-source-links-file:../db-dump/contest-source-links.sql}")
    private String sourceLinksFile;

    @Override
    public void seed() {
        try {
            String statements = Files.readString(Path.of(sourceLinksFile));
            for (String statement : statements.split(";")) {
                if (!statement.isBlank()) {
                    jdbcTemplate.execute(statement);
                }
            }
        } catch (IOException exception) {
            throw new IllegalStateException("공고 원문 링크 파일을 읽지 못했습니다.", exception);
        }
    }
}
