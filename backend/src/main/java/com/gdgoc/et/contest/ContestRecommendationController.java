package com.gdgoc.et.contest;

import com.gdgoc.et.common.error.ApiException;
import com.gdgoc.et.common.web.CurrentUser;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ContestRecommendationController {

    private final ContestRecommendationRepository recommendations;

    @GetMapping("/api/contests/recommendations")
    public List<RecommendedContest> recommend(@CurrentUser Long userId) {
        if (recommendations.countUsersById(userId) == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "현재 사용자를 찾을 수 없습니다.");
        }
        Map<Long, List<ContestTag>> tagsByContest = recommendations.findTagsOfOpenContestsFor(userId).stream()
                .collect(Collectors.groupingBy(
                        ContestRecommendationRepository.TagRow::getContestId,
                        Collectors.mapping(
                                row -> new ContestTag(row.getAxis(), row.getName(), row.getMatched() > 0),
                                Collectors.toList())));
        return recommendations.findRecommendedFor(userId).stream()
                .map(row -> new RecommendedContest(
                        row.getId(),
                        row.getTitle(),
                        row.getHost(),
                        row.getEndDate().toLocalDate(),
                        row.getPrize(),
                        row.getBenefit(),
                        row.getOverlap(),
                        tagsByContest.getOrDefault(row.getId(), List.of())))
                .toList();
    }

    public record RecommendedContest(
            long id,
            String title,
            String host,
            LocalDate endDate,
            String prize,
            String benefit,
            long overlap,
            List<ContestTag> tags) {
    }

    public record ContestTag(String axis, String name, boolean matched) {
    }
}
