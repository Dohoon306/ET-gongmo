package com.gdgoc.et.user;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.LongStream;
import org.junit.jupiter.api.Test;

class CategoryCatalogTest {

    @Test
    void hasFortyFiveCategoriesWithIdsOneToFortyFiveInOrder() {
        assertThat(CategoryCatalog.ALL).hasSize(45);
        assertThat(CategoryCatalog.ALL.stream().map(CategorySeed::id))
                .containsExactlyElementsOf(LongStream.rangeClosed(1, 45).boxed().toList());
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
                .containsEntry("excel", 45L);
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
                .containsExactly(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14);
        assertThat(sortOrdersByAxis.get(CategoryAxis.SKILL))
                .containsExactly(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13);
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
