package com.gdgoc.et.admin;

import com.gdgoc.et.common.web.CurrentUser;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reports;

    public record AppealBody(String reason) {}

    @PostMapping("/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> report(@CurrentUser Long userId, @RequestBody ReportService.ReportInput body) {
        return Map.of("reportId", reports.report(userId, body));
    }

    @GetMapping("/my/evaluations")
    public List<ReportService.MyEvaluation> myEvaluations(@CurrentUser Long userId) {
        return reports.myEvaluations(userId);
    }

    @PostMapping("/my/evaluations/{evaluationId}/appeal")
    public void appeal(@CurrentUser Long userId, @PathVariable long evaluationId, @RequestBody AppealBody body) {
        reports.appeal(userId, evaluationId, body.reason());
    }
}
