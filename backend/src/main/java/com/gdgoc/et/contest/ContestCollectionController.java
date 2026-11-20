package com.gdgoc.et.contest;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contests")
@RequiredArgsConstructor
public class ContestCollectionController {

    private final ContestCollector contestCollector;

    @PostMapping("/collect")
    public ContestCollector.CollectionResult collect() {
        return contestCollector.collect();
    }

    @PostMapping("/restore-snapshot")
    public ContestCollector.CollectionResult restoreSnapshot() {
        return contestCollector.restoreLatestSnapshot();
    }
}
