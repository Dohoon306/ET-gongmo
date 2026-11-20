package com.gdgoc.et.contest;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contests")
@RequiredArgsConstructor
public class ContestClassificationController {

    private final ContestClassificationService classificationService;

    @PostMapping("/classify")
    public ClassificationResult classify() {
        return new ClassificationResult(classificationService.classifyStoredContests());
    }

    public record ClassificationResult(int contests) {
    }
}
