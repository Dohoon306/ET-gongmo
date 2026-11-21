package com.gdgoc.et.user;

import com.gdgoc.et.common.ai.AiClient;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeSet;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CategorySuggester {

    private static final Map<String, CategorySeed> SEED_BY_CODE = CategoryCatalog.ALL.stream()
            .collect(Collectors.toUnmodifiableMap(CategorySeed::code, Function.identity()));

    private static final Map<String, List<String>> KEYWORDS_BY_CODE = Map.ofEntries(
            Map.entry("it", List.of("it", "개발", "코딩", "프로그래밍", "소프트웨어")),
            Map.entry("idea", List.of("아이디어")),
            Map.entry("design", List.of("디자인")),
            Map.entry("art", List.of("미술", "음악", "그림")),
            Map.entry("video", List.of("영상", "사진")),
            Map.entry("writing", List.of("문학", "논문", "소설", "수필")),
            Map.entry("naming", List.of("네이밍", "슬로건")),
            Map.entry("marketing", List.of("마케팅")),
            Map.entry("startup", List.of("창업", "취업")),
            Map.entry("supporters", List.of("서포터즈", "기자단")),
            Map.entry("volunteer", List.of("봉사")),
            Map.entry("graphic_design", List.of("그래픽", "포스터")),
            Map.entry("illustration", List.of("일러스트")),
            Map.entry("video_editing", List.of("편집")),
            Map.entry("shooting", List.of("촬영")),
            Map.entry("copywriting", List.of("글쓰기", "글 쓰", "카피")),
            Map.entry("promotion", List.of("홍보", "sns")),
            Map.entry("research", List.of("조사", "리서치")),
            Map.entry("presentation", List.of("발표", "피칭")),
            Map.entry("photoshop", List.of("photoshop", "포토샵")),
            Map.entry("illustrator", List.of("illustrator", "일러스트레이터")),
            Map.entry("premiere", List.of("premiere", "프리미어")),
            Map.entry("after_effects", List.of("after effects", "애프터 이펙트", "에펙")),
            Map.entry("powerpoint", List.of("powerpoint", "ppt", "파워포인트")),
            Map.entry("excel", List.of("excel", "엑셀")),
            Map.entry("backend", List.of("백엔드", "서버")),
            Map.entry("frontend", List.of("프론트")),
            Map.entry("app", List.of("앱", "안드로이드", "ios")),
            Map.entry("ai_data", List.of("ai", "인공지능", "데이터", "머신러닝")),
            Map.entry("uiux", List.of("ui", "ux")),
            Map.entry("planning", List.of("기획")),
            Map.entry("java", List.of("java", "자바")),
            Map.entry("spring", List.of("spring", "스프링")),
            Map.entry("python", List.of("python", "파이썬")),
            Map.entry("javascript", List.of("javascript", "자바스크립트")),
            Map.entry("react", List.of("react", "리액트")),
            Map.entry("kotlin", List.of("kotlin", "코틀린")),
            Map.entry("figma", List.of("figma", "피그마")),
            Map.entry("beginner", List.of("초보", "처음", "입문")),
            Map.entry("experienced", List.of("경험이 있", "경험 있", "해본 적")),
            Map.entry("expert", List.of("숙련", "능숙")),
            Map.entry("learn", List.of("배우고", "해보고 싶", "공부")),
            Map.entry("portfolio", List.of("포트폴리오")),
            Map.entry("award", List.of("수상", "입상")));

    private final AiClient aiClient;

    public List<Long> suggest(String intro) {
        if (intro == null || intro.isBlank()) {
            return List.of();
        }
        return toCategoryIds(aiClient.ask(promptFor(intro), keywordAnswer(intro)));
    }

    private String promptFor(String intro) {
        String catalog = CategoryCatalog.ALL.stream()
                .map(seed -> seed.code() + "(" + seed.axis() + ", " + seed.name() + ")")
                .collect(Collectors.joining(", "));
        return """
                공모전 참가자의 자기소개를 읽고 아래 태그 목록 안에서만 어울리는 태그를 골라 주세요.
                목록에 없는 태그는 만들지 마세요. LEVEL 태그는 하나만 고르세요.
                답은 설명 없이 태그 코드만 쉼표로 이어서 쓰세요. 예: it,backend,java

                태그 목록: %s

                자기소개: %s
                """.formatted(catalog, intro);
    }

    private String keywordAnswer(String intro) {
        String lowered = intro.toLowerCase(Locale.ROOT);
        return CategoryCatalog.ALL.stream()
                .map(CategorySeed::code)
                .filter(code -> KEYWORDS_BY_CODE.getOrDefault(code, List.of()).stream().anyMatch(lowered::contains))
                .collect(Collectors.joining(","));
    }

    private List<Long> toCategoryIds(String answer) {
        TreeSet<Long> ids = new TreeSet<>();
        boolean levelPicked = false;
        for (String token : answer.toLowerCase(Locale.ROOT).split("[^a-z_]+")) {
            CategorySeed seed = SEED_BY_CODE.get(token);
            if (seed == null) {
                continue;
            }
            if (seed.axis() == CategoryAxis.LEVEL) {
                if (levelPicked) {
                    continue;
                }
                levelPicked = true;
            }
            ids.add(seed.id());
        }
        return List.copyOf(ids);
    }
}
