package com.gdgoc.et.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.sql.Timestamp;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.jdbc.core.JdbcTemplate;

class UserSeedContributorTest {

    private static final String INSERT_USER = "INSERT INTO users (id, name, created_at) VALUES (?, ?, ?)";
    private static final String INSERT_TAG = "INSERT INTO user_category (user_id, category_id) VALUES (?, ?)";

    private final CategoryInitializer categoryInitializer = mock(CategoryInitializer.class);
    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);

    private final UserSeedContributor contributor = new UserSeedContributor(categoryInitializer, jdbcTemplate);

    @Test
    void seedUsersHaveFixedIdsOneToSeven() {
        assertThat(UserSeedContributor.SEED_USERS)
                .extracting(UserSeedContributor.SeedUser::id)
                .containsExactly(2L, 3L, 4L, 5L, 6L, 7L, 8L);
    }

    @Test
    void everySeedTagIsInCatalog() {
        for (UserSeedContributor.SeedUser user : UserSeedContributor.SEED_USERS) {
            for (String code : user.categoryCodes()) {
                assertThatCode(() -> UserSeedContributor.categoryIdOf(code)).doesNotThrowAnyException();
            }
        }
    }

    @Test
    void fillsCategoriesBeforeUsersAndTheirTags() {
        contributor.seed();

        Timestamp seededAt = Timestamp.valueOf(UserSeedContributor.SEEDED_AT);
        InOrder order = inOrder(categoryInitializer, jdbcTemplate);
        order.verify(categoryInitializer).insertMissingCategories();
        order.verify(jdbcTemplate).update(INSERT_USER, 2L, "방장 김", seededAt);
        order.verify(jdbcTemplate).update(INSERT_TAG, 2L, 1L);
        verify(jdbcTemplate).update(INSERT_USER, 8L, "새싹(작년)", seededAt);
        for (long categoryId : new long[] {1L, 13L, 19L, 26L, 29L}) {
            verify(jdbcTemplate).update(INSERT_TAG, 8L, categoryId);
        }
        verify(jdbcTemplate, times(7)).update(eq(INSERT_USER), anyLong(), anyString(), eq(seededAt));
        verify(jdbcTemplate, times(32)).update(eq(INSERT_TAG), anyLong(), anyLong());
    }
}
