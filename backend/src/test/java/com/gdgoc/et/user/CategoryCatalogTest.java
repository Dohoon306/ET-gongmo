package com.gdgoc.et.user;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.LongStream;
import org.junit.jupiter.api.Test;

class CategoryCatalogTest {

    @Test
    void hasSeventyOneCategoriesWithIdsOneToSeventyOneInOrder() {
        assertThat(CategoryCatalog.ALL).hasSize(71);
        assertThat(CategoryCatalog.ALL.stream().map(CategorySeed::id))
                .containsExactlyElementsOf(LongStream.rangeClosed(1, 71).boxed().toList());
    }

    @Test
    void codesAreUnique() {
        assertThat(CategoryCatalog.ALL.stream().map(CategorySeed::code)).doesNotHaveDuplicates();
    }

    @Test
    void fixedIdsMatchTheSpec() {
        Map<String, Long> idByCode = CategoryCatalog.ALL.stream()
                .collect(Collectors.toMap(CategorySeed::code, CategorySeed::id));

        assertThat(idByCode)
                .containsEntry("it", 1L)
                .containsEntry("etc", 12L)
                .containsEntry("backend", 13L)
                .containsEntry("java", 19L)
                .containsEntry("beginner", 26L)
                .containsEntry("learn", 29L)
                .containsEntry("award", 31L);
    }

    @Test
    void addedCategoriesFollowTheOriginalThirtyOne() {
        Map<String, Long> idByCode = CategoryCatalog.ALL.stream()
                .collect(Collectors.toMap(CategorySeed::code, CategorySeed::id));

        assertThat(idByCode)
                .containsEntry("graphic_design", 32L)
                .containsEntry("presentation", 39L)
                .containsEntry("photoshop", 40L)
                .containsEntry("excel", 45L)
                .containsEntry("branding", 46L)
                .containsEntry("mentoring", 60L)
                .containsEntry("indesign", 61L)
                .containsEntry("notion", 71L);
    }

    @Test
    void everyRoleAndSkillBelongsToAtLeastOneField() {
        List<String> fieldCodes = codesOf(CategoryAxis.FIELD);

        assertThat(CategoryCatalog.ALL.stream()
                        .filter(seed -> seed.axis() == CategoryAxis.ROLE || seed.axis() == CategoryAxis.SKILL))
                .allSatisfy(seed -> assertThat(CategoryCatalog.fieldCodesOf(seed.code()))
                        .as(seed.code())
                        .isNotEmpty()
                        .isSubsetOf(fieldCodes)
                        .doesNotHaveDuplicates());
    }

    @Test
    void everyFieldOffersRolesAndSkills() {
        for (String fieldCode : codesOf(CategoryAxis.FIELD)) {
            assertThat(codesOf(CategoryAxis.ROLE).stream()
                            .filter(code -> CategoryCatalog.fieldCodesOf(code).contains(fieldCode)))
                    .as(fieldCode + " 직무")
                    .hasSizeGreaterThanOrEqualTo(3);
            assertThat(codesOf(CategoryAxis.SKILL).stream()
                            .filter(code -> CategoryCatalog.fieldCodesOf(code).contains(fieldCode)))
                    .as(fieldCode + " 기술")
                    .hasSizeGreaterThanOrEqualTo(2);
        }
    }

    @Test
    void fieldLevelAndGoalTagsBelongToNoField() {
        assertThat(CategoryCatalog.ALL.stream()
                        .filter(seed -> seed.axis() != CategoryAxis.ROLE && seed.axis() != CategoryAxis.SKILL))
                .allSatisfy(seed -> assertThat(CategoryCatalog.fieldCodesOf(seed.code())).isEmpty());
    }

    @Test
    void itFieldKeepsItsDeveloperRolesAndSkills() {
        assertThat(codesOf(CategoryAxis.ROLE).stream()
                        .filter(code -> CategoryCatalog.fieldCodesOf(code).contains("it")))
                .containsExactly("backend", "frontend", "app", "ai_data", "uiux", "planning");
        assertThat(codesOf(CategoryAxis.SKILL).stream()
                        .filter(code -> CategoryCatalog.fieldCodesOf(code).contains("it")))
                .containsExactly("java", "spring", "python", "javascript", "react", "kotlin", "figma");
        assertThat(CategoryCatalog.fieldCodesOf("java")).containsExactly("it");
        assertThat(CategoryCatalog.fieldCodesOf("photoshop")).doesNotContain("it");
    }

    private List<String> codesOf(CategoryAxis axis) {
        return CategoryCatalog.ALL.stream()
                .filter(seed -> seed.axis() == axis)
                .map(CategorySeed::code)
                .toList();
    }

    @Test
    void codesUseOnlyLowercaseLettersAndUnderscores() {
        assertThat(CategoryCatalog.ALL.stream().map(CategorySeed::code)).allMatch(code -> code.matches("[a-z_]+"));
    }

    @Test
    void originalAxesAppearInOrderAndSortOrderStartsAtOneWithinEachAxis() {
        assertThat(CategoryCatalog.ALL.stream().limit(31).map(CategorySeed::axis).distinct())
                .containsExactly(CategoryAxis.values());

        Map<CategoryAxis, List<Integer>> sortOrdersByAxis = CategoryCatalog.ALL.stream()
                .collect(Collectors.groupingBy(
                        CategorySeed::axis, Collectors.mapping(CategorySeed::sortOrder, Collectors.toList())));

        assertThat(sortOrdersByAxis.get(CategoryAxis.FIELD)).containsExactly(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        assertThat(sortOrdersByAxis.get(CategoryAxis.ROLE))
                .containsExactlyElementsOf(IntStream.rangeClosed(1, 29).boxed().toList());
        assertThat(sortOrdersByAxis.get(CategoryAxis.SKILL))
                .containsExactlyElementsOf(IntStream.rangeClosed(1, 24).boxed().toList());
        assertThat(sortOrdersByAxis.get(CategoryAxis.LEVEL)).containsExactly(1, 2, 3);
        assertThat(sortOrdersByAxis.get(CategoryAxis.GOAL)).containsExactly(1, 2, 3);
    }

    @Test
    void namesMatchTheSpecForDemoTags() {
        Map<String, String> nameByCode = CategoryCatalog.ALL.stream()
                .collect(Collectors.toMap(CategorySeed::code, CategorySeed::name));

        assertThat(nameByCode)
                .containsEntry("it", "IT")
                .containsEntry("backend", "백엔드")
                .containsEntry("java", "Java")
                .containsEntry("beginner", "초보")
                .containsEntry("learn", "배우고 싶음");
    }
}
