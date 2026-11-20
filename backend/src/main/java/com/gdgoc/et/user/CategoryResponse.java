package com.gdgoc.et.user;

public record CategoryResponse(Long id, CategoryAxis axis, String code, String name, int sortOrder) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getAxis(),
                category.getCode(),
                category.getName(),
                category.getSortOrder());
    }
}
