package com.gdgoc.et.contest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.fasterxml.jackson.databind.json.JsonMapper;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class ContestSeedContributorTest {

    private static final long HERO_GONGMOA_ID = 100049285L;
    private static final LocalDate DEMO_DAY = LocalDate.of(2026, 11, 22);

    @Test
    void seedsContestsFromTheLatestSnapshot() {
        ContestCollector collector = mock(ContestCollector.class);

        new ContestSeedContributor(collector).seed();

        verify(collector).restoreLatestSnapshot();
    }

    @Test
    void committedSnapshotKeepsTheHeroContestOpenOnDemoDay() {
        List<ContestRecord> contests = committedSnapshot();

        assertThat(contests).filteredOn(contest -> contest.gongmoaId() == HERO_GONGMOA_ID).singleElement()
                .satisfies(hero -> {
                    assertThat(hero.fieldCodes()).contains("it");
                    assertThat(hero.endDate()).isAfter(DEMO_DAY);
                });
    }

    @Test
    void committedSnapshotMixesFieldsSoRecommendationsDiffer() {
        List<ContestRecord> contests = committedSnapshot();

        assertThat(contests).extracting(ContestRecord::gongmoaId).doesNotHaveDuplicates();
        assertThat(contests).allSatisfy(contest -> assertThat(contest.fieldCodes()).isNotEmpty());
        assertThat(contests).flatExtracting(ContestRecord::fieldCodes).contains("it", "idea", "video", "art");
    }

    private static List<ContestRecord> committedSnapshot() {
        ContestCollectionProperties defaults = new ContestCollectionProperties(null, null, null, 0, null);
        return new ContestSnapshotStore(JsonMapper.builder().findAndAddModules().build(), defaults).latest();
    }
}
