package com.gdgoc.et.contest;

import java.sql.Date;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

public interface ContestRecommendationRepository extends Repository<RecommendableContest, Long> {

    @Query(value = """
            SELECT c.id AS id, c.title AS title, c.host AS host, c.end_date AS endDate,
                   c.prize AS prize, c.benefit AS benefit, COUNT(uc.category_id) AS overlap
            FROM contest c
            LEFT JOIN contest_category cc ON cc.contest_id = c.id
            LEFT JOIN user_category uc   ON uc.category_id = cc.category_id AND uc.user_id = :userId
            WHERE c.end_date >= CURDATE()
            GROUP BY c.id
            ORDER BY overlap DESC, c.end_date ASC
            """, nativeQuery = true)
    List<ContestRow> findRecommendedFor(@Param("userId") long userId);

    @Query(value = """
            SELECT cc.contest_id AS contestId, cat.axis AS axis, cat.name AS name,
                   COUNT(uc.category_id) AS matched
            FROM contest_category cc
            JOIN contest c    ON c.id = cc.contest_id
            JOIN category cat ON cat.id = cc.category_id
            LEFT JOIN user_category uc ON uc.category_id = cc.category_id AND uc.user_id = :userId
            WHERE c.end_date >= CURDATE()
            GROUP BY cc.contest_id, cat.id
            ORDER BY cc.contest_id ASC, cat.id ASC
            """, nativeQuery = true)
    List<TagRow> findTagsOfOpenContestsFor(@Param("userId") long userId);

    @Query(value = "SELECT COUNT(*) FROM users WHERE id = :userId", nativeQuery = true)
    long countUsersById(@Param("userId") long userId);

    interface ContestRow {
        long getId();

        String getTitle();

        String getHost();

        Date getEndDate();

        String getPrize();

        String getBenefit();

        long getOverlap();
    }

    interface TagRow {
        long getContestId();

        String getAxis();

        String getName();

        long getMatched();
    }
}
