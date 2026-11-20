package com.gdgoc.et.contest;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
class GongmoaMarkdownParser {

    private static final Pattern CONTEST_ID = Pattern.compile("/contests/(\\d+)(?:[-/?#]|$)");
    private static final Pattern URL = Pattern.compile("https?://\\S+");
    private static final Pattern PERIOD = Pattern.compile("(\\d{4}-\\d{2}-\\d{2})\\s*~\\s*(\\d{4}-\\d{2}-\\d{2})");

    Optional<SearchContest> parseSearchLine(String line) {
        Matcher urlMatcher = URL.matcher(line);
        if (!urlMatcher.find()) {
            return Optional.empty();
        }
        String gongmoaUrl = trimUrl(urlMatcher.group());
        Matcher idMatcher = CONTEST_ID.matcher(gongmoaUrl);
        if (!idMatcher.find()) {
            return Optional.empty();
        }
        String title = line.startsWith("- ") ? line.substring(2) : line;
        int separator = title.indexOf(" — ");
        if (separator >= 0) {
            title = title.substring(0, separator);
        }
        return title.isBlank() ? Optional.empty() : Optional.of(new SearchContest(Long.parseLong(idMatcher.group(1)), title.strip(), gongmoaUrl));
    }

    ContestRecord parseDetail(long gongmoaId, String fallbackTitle, String fallbackUrl, String markdown, LocalDateTime fetchedAt, Set<String> fieldCodes) {
        LinkedHashMap<String, String> fields = new LinkedHashMap<>();
        String title = fallbackTitle;
        for (String line : markdown.split("\\R")) {
            if (line.startsWith("# ")) {
                title = line.substring(2).strip();
            } else if (line.startsWith("- ")) {
                int separator = line.indexOf(":");
                if (separator > 2) {
                    fields.put(line.substring(2, separator).strip(), line.substring(separator + 1).strip());
                }
            }
        }
        String period = fields.get("접수 기간");
        LocalDate startDate = null;
        LocalDate endDate = null;
        if (period != null) {
            Matcher periodMatcher = PERIOD.matcher(period);
            if (periodMatcher.find()) {
                startDate = LocalDate.parse(periodMatcher.group(1));
                endDate = LocalDate.parse(periodMatcher.group(2));
            }
        }
        String gongmoaUrl = urlFrom(fields.get("공모아뷰 페이지")).orElse(fallbackUrl);
        String sourceUrl = urlFrom(fields.get("주최 측 원문")).orElse(null);
        return new ContestRecord(
                gongmoaId,
                title,
                fields.get("유형"),
                fields.get("주최"),
                startDate,
                endDate,
                fields.get("대상"),
                fields.get("1등 상금"),
                fields.get("혜택"),
                fields.containsKey("주의"),
                gongmoaUrl,
                sourceUrl,
                markdown,
                fetchedAt,
                Set.copyOf(fieldCodes));
    }

    private Optional<String> urlFrom(String value) {
        if (value == null) {
            return Optional.empty();
        }
        Matcher matcher = URL.matcher(value);
        return matcher.find() ? Optional.of(trimUrl(matcher.group())) : Optional.empty();
    }

    private String trimUrl(String value) {
        return URI.create(value.replaceAll("[).,]+$", "")).toString();
    }

    record SearchContest(long gongmoaId, String title, String gongmoaUrl) {
    }
}
