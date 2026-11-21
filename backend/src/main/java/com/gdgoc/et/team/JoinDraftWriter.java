package com.gdgoc.et.team;

import com.gdgoc.et.common.ai.AiClient;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JoinDraftWriter {

    static final int MAX_LENGTH = 500;

    private final AiClient aiClient;

    public record DraftInput(long roomId, String roomTitle, String roomIntro, List<String> roomTags,
                             String userName, List<String> userTags) {}

    public String write(DraftInput input) {
        String fallback = templateDraft(input);
        return clean(aiClient.ask(promptFor(input), fallback), fallback);
    }

    private static String promptFor(DraftInput input) {
        return """
                공모전 팀원 모집 방에 보낼 참가 요청 메시지를 써 주세요.
                지원자의 태그와 방이 원하는 팀원 태그를 보고, 겹치는 점을 자연스럽게 살려 주세요.
                존댓말로 2~3문장, 200자 안쪽으로 쓰고, 지원자가 갖지 않은 경험은 지어내지 마세요.
                답은 메시지 본문만 쓰세요. 따옴표나 설명은 붙이지 마세요.

                방 제목: %s
                방 소개: %s
                방이 원하는 팀원 태그: %s

                지원자 이름: %s
                지원자 태그: %s
                """.formatted(input.roomTitle(), orNone(input.roomIntro()), joinOrNone(input.roomTags()),
                input.userName(), joinOrNone(input.userTags()));
    }

    static String templateDraft(DraftInput input) {
        List<String> shared = input.userTags().stream().filter(input.roomTags()::contains).toList();
        String strength = shared.isEmpty() ? "" : String.join(", ", shared) + " 쪽으로 함께할 수 있을 것 같아 ";
        return "안녕하세요! '" + input.roomTitle() + "' 방을 보고 " + strength + "참가를 요청드립니다. "
                + "맡은 부분은 끝까지 책임지고 해내겠습니다.";
    }

    private static String clean(String answer, String fallback) {
        if (answer == null) {
            return fallback;
        }
        String text = answer.strip().replaceAll("^[\"'“”‘’]+|[\"'“”‘’]+$", "").strip();
        if (text.isEmpty()) {
            return fallback;
        }
        return text.length() > MAX_LENGTH ? text.substring(0, MAX_LENGTH) : text;
    }

    private static String orNone(String text) {
        return text == null || text.isBlank() ? "(없음)" : text;
    }

    private static String joinOrNone(List<String> tags) {
        return tags.isEmpty() ? "(없음)" : String.join(", ", tags);
    }
}
