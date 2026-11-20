package com.gdgoc.et.profile;

import com.gdgoc.et.common.seed.SeedContributor;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(4)
public class EvaluationSeedContributor implements SeedContributor {

    record SeedEvaluation(long id, long roomId, long evaluatorId, long targetId, int score, String comment,
                          LocalDateTime createdAt) {}

    static final String INSERT_EVALUATION = """
            INSERT INTO evaluation (id, room_id, evaluator_id, target_id, score, comment, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """;

    static final long CLOSED_ROOM_ID = 5;
    static final long HOST_KIM_ID = 2;
    static final long MEMBER_HAN_ID = 7;

    static final List<SeedEvaluation> SEED_EVALUATIONS = List.of(
            new SeedEvaluation(1, CLOSED_ROOM_ID, HOST_KIM_ID, MEMBER_HAN_ID, 4,
                    "맡은 화면을 끝까지 책임지고 마무리했어요", LocalDateTime.of(2025, 12, 20, 12, 0)));

    private final JdbcTemplate jdbc;

    public EvaluationSeedContributor(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional
    public void seed() {
        for (SeedEvaluation evaluation : SEED_EVALUATIONS) {
            jdbc.update(INSERT_EVALUATION, evaluation.id(), evaluation.roomId(), evaluation.evaluatorId(),
                    evaluation.targetId(), evaluation.score(), evaluation.comment(),
                    Timestamp.valueOf(evaluation.createdAt()));
        }
    }
}
