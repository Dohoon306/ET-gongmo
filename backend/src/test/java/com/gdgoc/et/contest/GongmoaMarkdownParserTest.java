package com.gdgoc.et.contest;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import org.junit.jupiter.api.Test;

class GongmoaMarkdownParserTest {

    private final GongmoaMarkdownParser parser = new GongmoaMarkdownParser();

    @Test
    void parsesSearchResultUsingGongmoaIdFromUrl() {
        var contest = parser.parseSearchLine("- 대학생 AI 아이디어 공모전 — 공모전 · 한국기관 · 마감 2026-12-01 · 출처 2곳 · https://www.gongmoaview.com/contests/1234-ai");

        assertThat(contest).hasValueSatisfying(value -> {
            assertThat(value.gongmoaId()).isEqualTo(1234L);
            assertThat(value.title()).isEqualTo("대학생 AI 아이디어 공모전");
        });
    }

    @Test
    void parsesDetailAndKeepsOriginalMarkdown() {
        String markdown = """
                # 대학생 AI 아이디어 공모전
                - 유형: 공모전
                - 주최: 한국기관
                - 접수 기간: 2026-11-01 ~ 2026-12-01
                - 대상: 대학생
                - 분야: 게임/소프트웨어
                - 1등 상금: 300만원
                - 혜택: 멘토링
                - 주의: 출처마다 접수 기간이 다름
                - 공모아뷰 페이지: https://www.gongmoaview.com/contests/1234-ai
                - 주최 측 원문: https://example.com/notice
                """;

        ContestRecord contest = parser.parseDetail(1234L, "목록 제목", "https://www.gongmoaview.com/contests/1234-ai", markdown, LocalDateTime.of(2026, 11, 20, 12, 0), Set.of("it"));

        assertThat(contest.title()).isEqualTo("대학생 AI 아이디어 공모전");
        assertThat(contest.startDate()).isEqualTo(LocalDate.of(2026, 11, 1));
        assertThat(contest.endDate()).isEqualTo(LocalDate.of(2026, 12, 1));
        assertThat(contest.periodMismatch()).isTrue();
        assertThat(contest.sourceUrl()).isEqualTo("https://example.com/notice");
        assertThat(contest.rawText()).isEqualTo(markdown);
        assertThat(contest.fieldCodes()).containsExactly("it");
    }
}
