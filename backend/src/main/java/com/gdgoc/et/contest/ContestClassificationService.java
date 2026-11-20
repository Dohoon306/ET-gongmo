package com.gdgoc.et.contest;

import com.gdgoc.et.common.ai.AiClient;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
class ContestClassificationService {

    private static final Set<String> FIELD_CODES = Set.of("it", "idea", "design", "art", "video", "writing", "naming", "marketing", "startup", "supporters", "volunteer", "etc");
    private static final Set<String> AI_CODES = Set.of("backend", "frontend", "app", "ai_data", "uiux", "planning", "graphic_design", "illustration", "video_editing", "shooting", "copywriting", "promotion", "research", "presentation", "branding", "drawing", "composing", "performance", "directing", "motion_graphics", "proofreading", "ideation", "content_creation", "market_analysis", "business_planning", "reporting", "field_activity", "event_operation", "mentoring", "java", "spring", "python", "javascript", "react", "kotlin", "figma", "photoshop", "illustrator", "premiere", "after_effects", "powerpoint", "excel", "indesign", "procreate", "daw", "final_cut", "lightroom", "capcut", "canva", "google_analytics", "hwp", "word", "notion", "beginner", "experienced", "expert", "learn", "portfolio", "award");
    private static final Map<String, String> CODE_BY_NAME = Map.ofEntries(
            Map.entry("백엔드", "backend"), Map.entry("프론트엔드", "frontend"), Map.entry("앱", "app"), Map.entry("AI·데이터", "ai_data"), Map.entry("UI/UX", "uiux"), Map.entry("기획", "planning"),
            Map.entry("그래픽 디자인", "graphic_design"), Map.entry("일러스트", "illustration"), Map.entry("영상 편집", "video_editing"), Map.entry("촬영", "shooting"), Map.entry("글쓰기·카피", "copywriting"), Map.entry("홍보·SNS", "promotion"), Map.entry("자료 조사", "research"), Map.entry("발표", "presentation"),
            Map.entry("Java", "java"), Map.entry("Spring", "spring"), Map.entry("Python", "python"), Map.entry("JavaScript", "javascript"), Map.entry("React", "react"), Map.entry("Kotlin", "kotlin"), Map.entry("Figma", "figma"),
            Map.entry("Photoshop", "photoshop"), Map.entry("Illustrator", "illustrator"), Map.entry("Premiere Pro", "premiere"), Map.entry("After Effects", "after_effects"), Map.entry("PowerPoint", "powerpoint"), Map.entry("Excel", "excel"),
            Map.entry("브랜딩", "branding"), Map.entry("회화·드로잉", "drawing"), Map.entry("작곡·편곡", "composing"), Map.entry("연주·보컬", "performance"), Map.entry("연출·스토리", "directing"), Map.entry("모션그래픽", "motion_graphics"), Map.entry("교정·퇴고", "proofreading"), Map.entry("아이디어 발상", "ideation"), Map.entry("콘텐츠 제작", "content_creation"), Map.entry("시장 분석", "market_analysis"), Map.entry("사업 계획", "business_planning"), Map.entry("취재·인터뷰", "reporting"), Map.entry("현장 활동", "field_activity"), Map.entry("행사 운영", "event_operation"), Map.entry("교육·멘토링", "mentoring"),
            Map.entry("InDesign", "indesign"), Map.entry("Procreate", "procreate"), Map.entry("작곡 프로그램(DAW)", "daw"), Map.entry("Final Cut Pro", "final_cut"), Map.entry("Lightroom", "lightroom"), Map.entry("CapCut", "capcut"), Map.entry("Canva", "canva"), Map.entry("Google Analytics", "google_analytics"), Map.entry("한글(HWP)", "hwp"), Map.entry("MS Word", "word"), Map.entry("Notion", "notion"),
            Map.entry("초보", "beginner"), Map.entry("경험 있음", "experienced"), Map.entry("숙련", "expert"), Map.entry("배우고 싶음", "learn"), Map.entry("포트폴리오", "portfolio"), Map.entry("수상 목표", "award"));
    private static final Map<String, String> FIELD_BY_DETAIL = Map.ofEntries(
            Map.entry("게임/소프트웨어", "it"), Map.entry("IT", "it"), Map.entry("기획", "idea"), Map.entry("디자인", "design"), Map.entry("미술", "art"), Map.entry("음악", "art"), Map.entry("영상", "video"), Map.entry("사진", "video"), Map.entry("문학", "writing"), Map.entry("논문", "writing"), Map.entry("마케팅", "marketing"), Map.entry("창업", "startup"), Map.entry("서포터즈", "supporters"), Map.entry("봉사", "volunteer"));

    private final JdbcTemplate jdbcTemplate;
    private final AiClient aiClient;
    private final ContestClassificationProperties properties;

    @Transactional
    void classify(List<ContestRecord> contests) {
        for (ContestRecord contest : contests) {
            Long contestId = jdbcTemplate.queryForObject("SELECT id FROM contest WHERE gongmoa_id = ?", Long.class, contest.gongmoaId());
            if (contestId == null) {
                continue;
            }
            replaceCategories(contestId, categoriesFor(contest));
        }
    }

    @Transactional
    int classifyStoredContests() {
        List<StoredContest> contests = jdbcTemplate.query("SELECT id, gongmoa_id, title, raw_text FROM contest", (rows, rowNum) -> new StoredContest(rows.getLong("id"), rows.getLong("gongmoa_id"), rows.getString("title"), rows.getString("raw_text")));
        for (StoredContest contest : contests) {
            ContestRecord record = new ContestRecord(contest.gongmoaId(), contest.title(), null, null, null, null, null, null, null, false, "", null, contest.rawText(), null, fieldsFromDetail(contest.rawText()));
            replaceCategories(contest.id(), categoriesFor(record));
        }
        return contests.size();
    }

    private void replaceCategories(long contestId, Set<String> codes) {
        jdbcTemplate.update("DELETE FROM contest_category WHERE contest_id = ?", contestId);
        for (String code : codes) {
            jdbcTemplate.update("INSERT IGNORE INTO contest_category (contest_id, category_id) SELECT ?, id FROM category WHERE code = ?", contestId, code);
        }
    }

    private Set<String> categoriesFor(ContestRecord contest) {
        LinkedHashSet<String> codes = new LinkedHashSet<>(contest.fieldCodes() == null ? fieldsFromDetail(contest.rawText()) : contest.fieldCodes());
        codes.retainAll(FIELD_CODES);
        if (contest.gongmoaId() == properties.heroGongmoaId() && properties.heroGongmoaId() > 0) {
            codes.addAll(List.of("it", "backend", "frontend", "beginner", "learn"));
            return codes;
        }
        codes.addAll(aiCodes(contest));
        return codes;
    }

    private Set<String> aiCodes(ContestRecord contest) {
        List<String> fieldCodes = List.copyOf(contest.fieldCodes() == null ? fieldsFromDetail(contest.rawText()) : contest.fieldCodes());
        Set<String> choosableCodes = codesChoosableIn(fieldCodes);
        String fields = String.join(", ", fieldCodes);
        String prompt = "공모전 제목과 분야를 보고 아래 코드 중 직무, 기술, 수준, 목표 코드만 쉼표로 답하세요. 목록 밖 단어는 쓰지 마세요. 코드: " + String.join(", ", choosableCodes) + "\n제목: " + contest.title() + "\n분야: " + fields;
        String answer = aiClient.ask(prompt, "");
        LinkedHashSet<String> codes = new LinkedHashSet<>();
        CODE_BY_NAME.forEach((name, code) -> {
            if (answer.contains(name) && choosableCodes.contains(code)) {
                codes.add(code);
            }
        });
        for (String token : Pattern.compile("[\\s,|/]+").split(answer)) {
            String code = CODE_BY_NAME.getOrDefault(token.strip(), token.strip().toLowerCase());
            if (choosableCodes.contains(code)) {
                codes.add(code);
            }
        }
        return codes;
    }

    private Set<String> codesChoosableIn(List<String> fieldCodes) {
        if (fieldCodes.isEmpty()) {
            return AI_CODES;
        }
        String fieldPlaceholders = String.join(", ", Collections.nCopies(fieldCodes.size(), "?"));
        LinkedHashSet<String> codes = new LinkedHashSet<>(jdbcTemplate.queryForList("""
                SELECT c.code
                FROM category c
                WHERE c.axis IN ('LEVEL', 'GOAL')
                   OR EXISTS (SELECT 1 FROM category_field cf JOIN category f ON f.id = cf.field_id
                              WHERE cf.category_id = c.id AND f.code IN (%s))
                ORDER BY c.id
                """.formatted(fieldPlaceholders), String.class, fieldCodes.toArray()));
        codes.retainAll(AI_CODES);
        return codes;
    }

    private Set<String> fieldsFromDetail(String rawText) {
        LinkedHashSet<String> codes = new LinkedHashSet<>();
        String text = rawText == null ? "" : rawText;
        FIELD_BY_DETAIL.forEach((marker, code) -> { if (text.contains(marker)) codes.add(code); });
        return codes.isEmpty() ? Set.of("etc") : codes;
    }

    private record StoredContest(long id, long gongmoaId, String title, String rawText) {
    }
}
