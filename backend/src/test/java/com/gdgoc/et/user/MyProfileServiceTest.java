package com.gdgoc.et.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.gdgoc.et.common.error.ApiException;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class MyProfileServiceTest {

    private final UserRepository userRepository = mock(UserRepository.class);

    private final CategorySuggester categorySuggester = mock(CategorySuggester.class);

    private final MyProfileService service = new MyProfileService(userRepository, categorySuggester);

    private final User user = new User("새싹", "자기소개");

    @Test
    void unknownUserIsNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.suggestCategories(99L))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void suggestionCarriesIntroAndSuggestedTags() {
        when(userRepository.findById(8L)).thenReturn(Optional.of(user));
        when(categorySuggester.suggest("자기소개")).thenReturn(List.of(1L, 13L));

        CategorySuggestionResponse suggestion = service.suggestCategories(8L);

        assertThat(suggestion.name()).isEqualTo("새싹");
        assertThat(suggestion.intro()).isEqualTo("자기소개");
        assertThat(suggestion.categoryIds()).containsExactly(1L, 13L);
    }
}
