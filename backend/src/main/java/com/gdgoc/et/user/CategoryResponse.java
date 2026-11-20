package com.gdgoc.et.user;

import java.util.List;

public record CategoryResponse(
        Long id, CategoryAxis axis, String code, String name, int sortOrder, List<String> fieldCodes) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getAxis(),
                category.getCode(),
                category.getName(),
                category.getSortOrder(),
                CategoryCatalog.fieldCodesOf(category.getCode()));
    }
}
