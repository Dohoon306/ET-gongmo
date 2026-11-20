package com.gdgoc.et.profile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class EvaluationSeedContributorTest {

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);

    @Test
    void hostKimHasAlreadyReviewedMemberHanInTheClosedTeam() {
        new EvaluationSeedContributor(jdbc).seed();

        verify(jdbc).update(EvaluationSeedContributor.INSERT_EVALUATION, 1L, 5L, 1L, 6L, 4,
                "맡은 화면을 끝까지 책임지고 마무리했어요", Timestamp.valueOf(LocalDateTime.of(2025, 12, 20, 12, 0)));
        verifyNoMoreInteractions(jdbc);
    }

    @Test
    void lastYearSproutHasNotReviewedAnyoneYet() {
        assertThat(EvaluationSeedContributor.SEED_EVALUATIONS)
                .extracting(EvaluationSeedContributor.SeedEvaluation::evaluatorId).doesNotContain(7L);
        assertThat(EvaluationSeedContributor.SEED_EVALUATIONS).allSatisfy(evaluation -> {
            assertThat(evaluation.score()).isBetween(1, 5);
            assertThat(evaluation.comment()).hasSizeLessThanOrEqualTo(200);
            assertThat(evaluation.evaluatorId()).isNotEqualTo(evaluation.targetId());
        });
    }
}
