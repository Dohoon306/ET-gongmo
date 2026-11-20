package com.gdgoc.et.contest;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

@Entity
@Immutable
@Table(name = "contest")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecommendableContest {

    @Id
    private Long id;
}
