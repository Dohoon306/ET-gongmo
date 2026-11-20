package com.gdgoc.et.contest;

import com.gdgoc.et.common.error.ApiException;
import java.time.LocalDate;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contests")
public class ContestDetailController {

    private final JdbcTemplate jdbc;

    public ContestDetailController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/{contestId}")
    public ContestDetail find(@PathVariable long contestId) {
        List<ContestDetail> contests = jdbc.query("""
                SELECT c.id, c.title, c.type, c.host, c.start_date, c.end_date, c.target,
                       c.prize, c.benefit, c.period_mismatch, c.gongmoa_url, c.source_url, c.raw_text,
                       GROUP_CONCAT(category.name ORDER BY category.sort_order SEPARATOR ',') AS category_names
                FROM contest c
                LEFT JOIN contest_category cc ON cc.contest_id = c.id
                LEFT JOIN category ON category.id = cc.category_id
                WHERE c.id = ?
                GROUP BY c.id, c.title, c.type, c.host, c.start_date, c.end_date, c.target,
                         c.prize, c.benefit, c.period_mismatch, c.gongmoa_url, c.source_url, c.raw_text
                """, (row, index) -> {
            String rawText = row.getString("raw_text");
            return new ContestDetail(
                    row.getLong("id"), row.getString("title"), row.getString("type"), row.getString("host"),
                    row.getObject("start_date", LocalDate.class), row.getObject("end_date", LocalDate.class),
                    row.getString("target"), row.getString("prize"), row.getString("benefit"),
                    row.getBoolean("period_mismatch"), row.getString("gongmoa_url"), row.getString("source_url"),
                    categoryNames(row.getString("category_names")), optionalValue(rawText, "활동 기간"),
                    optionalValue(rawText, "장소·방식|장소/방식|진행 방식"), optionalValue(rawText, "비용|참가비"));
        }, contestId);
        if (contests.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "공모전을 찾을 수 없습니다.");
        }
        return contests.get(0);
    }

    private List<String> categoryNames(String names) {
        return names == null || names.isBlank() ? List.of() : List.of(names.split(","));
    }

    private String optionalValue(String rawText, String label) {
        if (rawText == null || rawText.isBlank()) {
            return null;
        }
        Matcher matcher = Pattern.compile("(?im)^\\s*(?:" + label + ")\\s*[:：]\\s*(.+)$").matcher(rawText);
        return matcher.find() ? matcher.group(1).strip() : null;
    }

    public record ContestDetail(long id, String title, String type, String host, LocalDate startDate, LocalDate endDate,
                                String target, String prize, String benefit, boolean periodMismatch, String gongmoaUrl,
                                String sourceUrl, List<String> categories, String activityPeriod, String locationMethod,
                                String cost) {
    }
}
