package com.gdgoc.et.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "category")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Category {

    @Id
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CategoryAxis axis;

    @Column(nullable = false, length = 40, unique = true)
    private String code;

    @Column(nullable = false, length = 40)
    private String name;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    Category(Long id, CategoryAxis axis, String code, String name, int sortOrder) {
        this.id = id;
        this.axis = axis;
        this.code = code;
        this.name = name;
        this.sortOrder = sortOrder;
    }

    static Category from(CategorySeed seed) {
        return new Category(seed.id(), seed.axis(), seed.code(), seed.name(), seed.sortOrder());
    }
}
