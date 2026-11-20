package com.gdgoc.et.user;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String intro;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @ElementCollection
    @CollectionTable(name = "user_category", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "category_id", nullable = false)
    private Set<Long> categoryIds = new HashSet<>();

    public User(String name, String intro) {
        this.name = name;
        this.intro = intro;
    }

    public void rewriteProfile(String name, String intro) {
        this.name = name;
        this.intro = intro;
    }

    public void confirmCategories(Collection<Long> confirmedCategoryIds) {
        categoryIds.clear();
        categoryIds.addAll(confirmedCategoryIds);
    }
}
