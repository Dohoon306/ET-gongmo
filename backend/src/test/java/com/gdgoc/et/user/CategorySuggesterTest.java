package com.gdgoc.et.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.gdgoc.et.common.ai.AiClient;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class CategorySuggesterTest {

    private final AiClient aiClient = mock(AiClient.class);

    private final CategorySuggester suggester = new CategorySuggester(aiClient);

    @Test
    void demoIntroAsksAiLikeAnyOtherIntro() {
        String demoIntro = "학교에서 자바로 과제 좀 해봤고, 서버 쪽을 해보고 싶어요. IT 공모전은 처음이에요";
        when(aiClient.ask(anyString(), anyString())).thenReturn("it,backend,java,beginner,learn");

        assertThat(suggester.suggest(demoIntro)).containsExactly(1L, 13L, 19L, 26L, 29L);

        ArgumentCaptor<String> prompt = ArgumentCaptor.forClass(String.class);
        verify(aiClient).ask(prompt.capture(), anyString());
        assertThat(prompt.getValue()).contains(demoIntro);
    }

    @Test
    void tagsOutsideCatalogAreDropped() {
        when(aiClient.ask(anyString(), anyString())).thenReturn("react, rust, frontend, 열정, portfolio");

        assertThat(suggester.suggest("리액트로 화면을 만들어 봤어요")).containsExactly(14L, 23L, 30L);
    }

    @Test
    void keepsOnlyFirstLevelTag() {
        when(aiClient.ask(anyString(), anyString())).thenReturn("expert,beginner,python");

        assertThat(suggester.suggest("파이썬을 오래 썼어요")).containsExactly(21L, 28L);
    }

    @Test
    void fallsBackToKeywordsWhenAiFails() {
        when(aiClient.ask(anyString(), anyString())).thenAnswer(invocation -> invocation.getArgument(1));

        assertThat(suggester.suggest("파이썬으로 데이터 분석을 공부했고 포트폴리오를 만들고 싶어요"))
                .containsExactly(16L, 21L, 29L, 30L);
    }

    @Test
    void keywordFallbackCoversFieldsOutsideIt() {
        when(aiClient.ask(anyString(), anyString())).thenAnswer(invocation -> invocation.getArgument(1));

        assertThat(suggester.suggest("포토샵으로 포스터 디자인을 해봤고 공모전은 처음이에요"))
                .containsExactly(3L, 26L, 32L, 40L);
    }

    @Test
    void blankIntroHasNoSuggestion() {
        assertThat(suggester.suggest(" ")).isEmpty();
        assertThat(suggester.suggest(null)).isEmpty();

        verifyNoInteractions(aiClient);
    }
}
