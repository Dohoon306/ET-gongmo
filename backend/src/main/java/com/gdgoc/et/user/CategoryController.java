package com.gdgoc.et.user;

import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private static final Comparator<Category> AXIS_THEN_SORT_ORDER = Comparator
            .comparing(Category::getAxis)
            .thenComparingInt(Category::getSortOrder)
            .thenComparing(Category::getId);

    private final CategoryRepository categoryRepository;

    @GetMapping
    public List<CategoryResponse> listAll() {
        return categoryRepository.findAll().stream()
                .sorted(AXIS_THEN_SORT_ORDER)
                .map(CategoryResponse::from)
                .toList();
    }
}
