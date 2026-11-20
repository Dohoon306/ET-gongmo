package com.gdgoc.et.common.seed;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import javax.sql.DataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("seed")
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class SeedRunner implements ApplicationRunner {

    static final String CURRENT_SCHEMA_TABLES =
            "SELECT table_name FROM information_schema.tables"
                    + " WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'";

    private final DataSource dataSource;
    private final List<SeedContributor> contributorsInOrder;

    @Override
    public void run(ApplicationArguments args) throws SQLException {
        int truncated = truncateAllTables();
        for (SeedContributor contributor : contributorsInOrder) {
            contributor.seed();
        }
        log.info("시드 완료: 테이블 {}개를 비우고 시드 조각 {}개를 실행했습니다", truncated, contributorsInOrder.size());
    }

    private int truncateAllTables() throws SQLException {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            List<String> tables = currentSchemaTables(statement);
            statement.execute("SET FOREIGN_KEY_CHECKS = 0");
            try {
                for (String table : tables) {
                    statement.execute("TRUNCATE TABLE `" + table + "`");
                }
            } finally {
                statement.execute("SET FOREIGN_KEY_CHECKS = 1");
            }
            return tables.size();
        }
    }

    private List<String> currentSchemaTables(Statement statement) throws SQLException {
        List<String> tables = new ArrayList<>();
        try (ResultSet rows = statement.executeQuery(CURRENT_SCHEMA_TABLES)) {
            while (rows.next()) {
                tables.add(rows.getString(1));
            }
        }
        return tables;
    }
}
