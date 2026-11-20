package com.gdgoc.et.admin;

import java.sql.PreparedStatement;
import java.sql.Statement;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@RequiredArgsConstructor
public class AdminBootstrap implements ApplicationRunner {

    static final long ADMIN_ID = 1;
    static final String ADMIN_NAME = "관리자";
    static final String ADMIN_INTRO = "서비스 관리자 계정입니다.";

    private final JdbcTemplate jdbc;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Integer admins = jdbc.queryForObject("SELECT COUNT(*) FROM admin_account", Integer.class);
        if (admins != null && admins > 0) {
            return;
        }
        int tookFirstId = jdbc.update("""
                INSERT INTO users (id, name, intro)
                SELECT ?, ?, ? FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = ?)
                """, ADMIN_ID, ADMIN_NAME, ADMIN_INTRO, ADMIN_ID);
        if (tookFirstId == 1) {
            jdbc.update("INSERT INTO admin_account (user_id) VALUES (?)", ADMIN_ID);
            return;
        }
        GeneratedKeyHolder key = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement("INSERT INTO users (name, intro) VALUES (?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, ADMIN_NAME);
            ps.setString(2, ADMIN_INTRO);
            return ps;
        }, key);
        jdbc.update("INSERT INTO admin_account (user_id) VALUES (?)", key.getKey().longValue());
    }
}
