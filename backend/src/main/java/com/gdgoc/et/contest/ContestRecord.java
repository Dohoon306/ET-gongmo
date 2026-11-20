package com.gdgoc.et.contest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

public record ContestRecord(
        long gongmoaId,
        String title,
        String type,
        String host,
        LocalDate startDate,
        LocalDate endDate,
        String target,
        String prize,
        String benefit,
        boolean periodMismatch,
        String gongmoaUrl,
        String sourceUrl,
        String rawText,
        LocalDateTime fetchedAt,
        Set<String> fieldCodes) {
}
