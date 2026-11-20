package com.gdgoc.et.user;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class CategoryCatalog {

    public static final List<CategorySeed> ALL = build();

    private static final Map<String, List<String>> FIELD_CODES_BY_CODE = buildFieldCodesByCode();

    private CategoryCatalog() {
    }

    public static List<String> fieldCodesOf(String code) {
        return FIELD_CODES_BY_CODE.getOrDefault(code, List.of());
    }

    private static List<CategorySeed> build() {
        List<CategorySeed> seeds = new ArrayList<>();
        addAxis(seeds, CategoryAxis.FIELD,
                "it", "IT",
                "idea", "기획·아이디어",
                "design", "디자인",
                "art", "미술·음악",
                "video", "영상·사진",
                "writing", "문학·논문",
                "naming", "네이밍·슬로건",
                "marketing", "마케팅",
                "startup", "취업·창업",
                "supporters", "서포터즈·기자단",
                "volunteer", "봉사·체험",
                "etc", "기타");
        addAxis(seeds, CategoryAxis.ROLE,
                "backend", "백엔드",
                "frontend", "프론트엔드",
                "app", "앱",
                "ai_data", "AI·데이터",
                "uiux", "UI/UX",
                "planning", "기획");
        addAxis(seeds, CategoryAxis.SKILL,
                "java", "Java",
                "spring", "Spring",
                "python", "Python",
                "javascript", "JavaScript",
                "react", "React",
                "kotlin", "Kotlin",
                "figma", "Figma");
        addAxis(seeds, CategoryAxis.LEVEL,
                "beginner", "초보",
                "experienced", "경험 있음",
                "expert", "숙련");
        addAxis(seeds, CategoryAxis.GOAL,
                "learn", "배우고 싶음",
                "portfolio", "포트폴리오",
                "award", "수상 목표");
        addAxis(seeds, CategoryAxis.ROLE,
                "graphic_design", "그래픽 디자인",
                "illustration", "일러스트",
                "video_editing", "영상 편집",
                "shooting", "촬영",
                "copywriting", "글쓰기·카피",
                "promotion", "홍보·SNS",
                "research", "자료 조사",
                "presentation", "발표");
        addAxis(seeds, CategoryAxis.SKILL,
                "photoshop", "Photoshop",
                "illustrator", "Illustrator",
                "premiere", "Premiere Pro",
                "after_effects", "After Effects",
                "powerpoint", "PowerPoint",
                "excel", "Excel");
        addAxis(seeds, CategoryAxis.ROLE,
                "branding", "브랜딩",
                "drawing", "회화·드로잉",
                "composing", "작곡·편곡",
                "performance", "연주·보컬",
                "directing", "연출·스토리",
                "motion_graphics", "모션그래픽",
                "proofreading", "교정·퇴고",
                "ideation", "아이디어 발상",
                "content_creation", "콘텐츠 제작",
                "market_analysis", "시장 분석",
                "business_planning", "사업 계획",
                "reporting", "취재·인터뷰",
                "field_activity", "현장 활동",
                "event_operation", "행사 운영",
                "mentoring", "교육·멘토링");
        addAxis(seeds, CategoryAxis.SKILL,
                "indesign", "InDesign",
                "procreate", "Procreate",
                "daw", "작곡 프로그램(DAW)",
                "final_cut", "Final Cut Pro",
                "lightroom", "Lightroom",
                "capcut", "CapCut",
                "canva", "Canva",
                "google_analytics", "Google Analytics",
                "hwp", "한글(HWP)",
                "word", "MS Word",
                "notion", "Notion");
        return List.copyOf(seeds);
    }

    private static Map<String, List<String>> buildFieldCodesByCode() {
        Map<String, List<String>> fieldCodesByCode = new LinkedHashMap<>();
        linkToField(fieldCodesByCode, "it",
                "backend", "frontend", "app", "ai_data", "uiux", "planning",
                "java", "spring", "python", "javascript", "react", "kotlin", "figma");
        linkToField(fieldCodesByCode, "idea",
                "planning", "ideation", "research", "presentation",
                "powerpoint", "excel", "hwp", "word", "notion");
        linkToField(fieldCodesByCode, "design",
                "graphic_design", "uiux", "illustration", "branding", "motion_graphics",
                "figma", "photoshop", "illustrator", "indesign", "procreate");
        linkToField(fieldCodesByCode, "art",
                "illustration", "drawing", "composing", "performance",
                "photoshop", "illustrator", "procreate", "daw");
        linkToField(fieldCodesByCode, "video",
                "video_editing", "shooting", "directing", "motion_graphics",
                "premiere", "after_effects", "final_cut", "lightroom", "capcut", "photoshop");
        linkToField(fieldCodesByCode, "writing",
                "copywriting", "research", "proofreading",
                "hwp", "word");
        linkToField(fieldCodesByCode, "naming",
                "copywriting", "ideation", "research",
                "powerpoint", "hwp", "word");
        linkToField(fieldCodesByCode, "marketing",
                "promotion", "content_creation", "market_analysis", "planning", "presentation",
                "powerpoint", "excel", "photoshop", "canva", "google_analytics");
        linkToField(fieldCodesByCode, "startup",
                "business_planning", "market_analysis", "planning", "presentation", "research",
                "powerpoint", "excel", "hwp", "word", "notion");
        linkToField(fieldCodesByCode, "supporters",
                "promotion", "content_creation", "reporting", "shooting", "copywriting",
                "photoshop", "premiere", "capcut", "canva");
        linkToField(fieldCodesByCode, "volunteer",
                "field_activity", "event_operation", "mentoring", "promotion",
                "powerpoint", "excel", "canva");
        linkToField(fieldCodesByCode, "etc",
                "planning", "research", "presentation", "copywriting",
                "powerpoint", "excel", "hwp", "word", "notion");
        fieldCodesByCode.replaceAll((code, fieldCodes) -> List.copyOf(fieldCodes));
        return Map.copyOf(fieldCodesByCode);
    }

    private static void linkToField(Map<String, List<String>> fieldCodesByCode, String fieldCode, String... codes) {
        for (String code : codes) {
            fieldCodesByCode.computeIfAbsent(code, unlinked -> new ArrayList<>()).add(fieldCode);
        }
    }

    private static void addAxis(List<CategorySeed> seeds, CategoryAxis axis, String... codeAndNamePairs) {
        for (int i = 0; i < codeAndNamePairs.length; i += 2) {
            seeds.add(new CategorySeed(
                    seeds.size() + 1L, axis, codeAndNamePairs[i], codeAndNamePairs[i + 1], nextSortOrder(seeds, axis)));
        }
    }

    private static int nextSortOrder(List<CategorySeed> seeds, CategoryAxis axis) {
        return (int) seeds.stream().filter(seed -> seed.axis() == axis).count() + 1;
    }
}
