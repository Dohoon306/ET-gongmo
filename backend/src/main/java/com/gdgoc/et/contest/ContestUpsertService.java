package com.gdgoc.et.contest;

import java.sql.Timestamp;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
class ContestUpsertService {

    private final JdbcTemplate jdbcTemplate;

    @Transactional
    void upsertAll(List<ContestRecord> contests) {
        for (ContestRecord contest : contests) {
            jdbcTemplate.update("""
                    INSERT INTO contest (gongmoa_id, title, type, host, start_date, end_date, target, prize, benefit, period_mismatch, gongmoa_url, source_url, raw_text, fetched_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE title = VALUES(title), type = VALUES(type), host = VALUES(host), start_date = VALUES(start_date), end_date = VALUES(end_date), target = VALUES(target), prize = VALUES(prize), benefit = VALUES(benefit), period_mismatch = VALUES(period_mismatch), gongmoa_url = VALUES(gongmoa_url), source_url = COALESCE(VALUES(source_url), source_url), raw_text = VALUES(raw_text), fetched_at = VALUES(fetched_at)
                    """,
                    contest.gongmoaId(), contest.title(), contest.type(), contest.host(), contest.startDate(), contest.endDate(), contest.target(), contest.prize(), contest.benefit(), contest.periodMismatch(), contest.gongmoaUrl(), contest.sourceUrl(), contest.rawText(), Timestamp.valueOf(contest.fetchedAt()));
        }
    }
}
