package com.gdgoc.et.user;

import java.util.ArrayList;
import java.util.List;

public final class CategoryCatalog {

    public static final List<CategorySeed> ALL = build();

    private CategoryCatalog() {
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
        return List.copyOf(seeds);
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
