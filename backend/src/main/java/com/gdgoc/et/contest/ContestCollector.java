package com.gdgoc.et.contest;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;

@Slf4j
@Service
@RequiredArgsConstructor
class ContestCollector {

    private final GongmoaClient gongmoaClient;
    private final GongmoaMarkdownParser parser;
    private final ContestSnapshotStore snapshotStore;
    private final ContestUpsertService upsertService;
    private final ContestClassificationService classificationService;
    private final ContestCollectionProperties properties;

    CollectionResult collect() {
        try {
            List<ContestRecord> contests = collectFromGongmoa();
            upsertService.upsertAll(contests);
            classificationService.classify(contests);
            snapshotStore.save(contests);
            return new CollectionResult("gongmoa", contests.size());
        } catch (RuntimeException exception) {
            log.warn("공모아뷰 수집 실패, 최근 스냅샷으로 복구합니다: {}", exception.toString());
            List<ContestRecord> contests = snapshotStore.latest();
            upsertService.upsertAll(contests);
            classificationService.classify(contests);
            return new CollectionResult("snapshot", contests.size());
        }
    }

    CollectionResult restoreLatestSnapshot() {
        List<ContestRecord> contests = snapshotStore.latest();
        upsertService.upsertAll(contests);
        classificationService.classify(contests);
        return new CollectionResult("snapshot", contests.size());
    }

    private List<ContestRecord> collectFromGongmoa() {
        LinkedHashMap<Long, GongmoaMarkdownParser.SearchContest> found = new LinkedHashMap<>();
        LinkedHashMap<Long, LinkedHashSet<String>> fieldsByContest = new LinkedHashMap<>();
        for (String field : properties.fields()) {
            String searchResult = gongmoaClient.searchContests(field, properties.target(), properties.limit());
            for (String line : searchResult.split("\\R")) {
                parser.parseSearchLine(line).ifPresent(contest -> {
                    found.putIfAbsent(contest.gongmoaId(), contest);
                    fieldsByContest.computeIfAbsent(contest.gongmoaId(), ignored -> new LinkedHashSet<>()).add(field);
                });
            }
        }
        if (found.isEmpty()) {
            throw new IllegalStateException("공모아뷰에서 접수 중인 공모전을 찾지 못했습니다.");
        }
        return found.values().stream().map(contest -> detailWithRetry(contest, fieldsByContest.get(contest.gongmoaId()))).toList();
    }

    private ContestRecord detailWithRetry(GongmoaMarkdownParser.SearchContest contest, LinkedHashSet<String> fieldCodes) {
        RuntimeException lastFailure = null;
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                if (attempt > 1) {
                    pause(3_000);
                }
                String detail = gongmoaClient.getContest(contest.gongmoaId());
                ContestRecord parsed = parser.parseDetail(contest.gongmoaId(), contest.title(), contest.gongmoaUrl(), detail, LocalDateTime.now(), fieldCodes);
                pause(2_000);
                return parsed;
            } catch (RestClientResponseException exception) {
                lastFailure = exception;
                if (!retryable(exception.getStatusCode()) || attempt == 3) {
                    break;
                }
            } catch (RuntimeException exception) {
                lastFailure = exception;
                break;
            }
        }
        throw new IllegalStateException("공모전 상세를 수집하지 못했습니다: " + contest.gongmoaId(), lastFailure);
    }

    private boolean retryable(HttpStatusCode status) {
        return status.value() == 502 || status.value() == 530;
    }

    private void pause(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("공모전 수집이 중단됐습니다.", exception);
        }
    }

    public record CollectionResult(String source, int contests) {
    }
}
