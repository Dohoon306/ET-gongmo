package com.gdgoc.et.team;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gdgoc.et.common.ai.AiClient;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class JoinDraftWriterTest {

    private static final List<String> PERSONA_TAGS = List.of("IT", "백엔드", "Java", "초보", "배우고 싶음");

    private final AiClient aiClient = mock(AiClient.class);
    private final JoinDraftWriter writer = new JoinDraftWriter(aiClient);

    private JoinDraftWriter.DraftInput input(long roomId, List<String> userTags) {
        return new JoinDraftWriter.DraftInput(roomId, "Spring 서버 개발자 구합니다", "수상이 목표예요.",
                List.of("IT", "백엔드", "Java", "Spring", "수상 목표"), "새싹", userTags);
    }

    @Test
    void demoPersonaToRoomOneIsFixedWithoutCallingAi() {
        assertThat(writer.write(input(1, PERSONA_TAGS))).isEqualTo(JoinDraftWriter.DEMO_DRAFT);
        verify(aiClient, never()).ask(anyString(), anyString());
    }

    @Test
    void otherRoomsAskAiWithRoomAndUserTags() {
        when(aiClient.ask(anyString(), anyString())).thenReturn("  \"Spring을 배우며 서버를 맡고 싶어요.\"  ");

        String draft = writer.write(input(2, PERSONA_TAGS));

        ArgumentCaptor<String> prompt = ArgumentCaptor.forClass(String.class);
        verify(aiClient).ask(prompt.capture(), anyString());
        assertThat(prompt.getValue()).contains("Spring 서버 개발자 구합니다", "수상 목표", "새싹", "배우고 싶음");
        assertThat(draft).isEqualTo("Spring을 배우며 서버를 맡고 싶어요.");
    }

    @Test
    void fallbackMentionsSharedTagsWhenAiFails() {
        when(aiClient.ask(anyString(), anyString())).thenAnswer(call -> call.getArgument(1));

        String draft = writer.write(input(2, PERSONA_TAGS));

        assertThat(draft).contains("'Spring 서버 개발자 구합니다'", "IT, 백엔드, Java");
    }

    @Test
    void blankAiAnswerFallsBackAndLongAnswerIsCut() {
        when(aiClient.ask(anyString(), anyString())).thenReturn("   ");
        assertThat(writer.write(input(2, List.of("디자인")))).isEqualTo(JoinDraftWriter.templateDraft(input(2, List.of("디자인"))));

        when(aiClient.ask(anyString(), anyString())).thenReturn("가".repeat(800));
        assertThat(writer.write(input(2, List.of("디자인")))).hasSize(JoinDraftWriter.MAX_LENGTH);
    }
}
