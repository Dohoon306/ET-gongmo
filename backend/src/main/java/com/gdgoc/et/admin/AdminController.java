package com.gdgoc.et.admin;

import com.gdgoc.et.common.web.CurrentUser;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService admin;

    public record SuspendBody(String reason) {}

    @GetMapping("/status")
    public Map<String, Boolean> status(@CurrentUser(required = false) Long userId) {
        return Map.of("admin", admin.isAdmin(userId));
    }

    @GetMapping("/users")
    public List<AdminService.UserRow> users(@CurrentUser Long userId) {
        admin.requireAdmin(userId);
        return admin.users();
    }

    @PostMapping("/users/{targetId}/suspension")
    public void suspend(@CurrentUser Long userId, @PathVariable long targetId, @RequestBody(required = false) SuspendBody body) {
        admin.requireAdmin(userId);
        admin.suspend(targetId, body == null ? null : body.reason());
    }

    @DeleteMapping("/users/{targetId}/suspension")
    public void unsuspend(@CurrentUser Long userId, @PathVariable long targetId) {
        admin.requireAdmin(userId);
        admin.unsuspend(targetId);
    }

    @GetMapping("/evaluations")
    public List<AdminService.EvaluationRow> evaluations(@CurrentUser Long userId,
                                                        @RequestParam(required = false) Long userFilter) {
        admin.requireAdmin(userId);
        return admin.evaluations(userFilter);
    }

    @DeleteMapping("/evaluations/{evaluationId}")
    public void removeEvaluation(@CurrentUser Long userId, @PathVariable long evaluationId) {
        admin.requireAdmin(userId);
        admin.removeEvaluation(evaluationId);
    }

    @GetMapping("/appeals")
    public List<AdminService.AppealRow> appeals(@CurrentUser Long userId) {
        admin.requireAdmin(userId);
        return admin.appeals();
    }

    @PostMapping("/appeals/{appealId}/remove")
    public void removeByAppeal(@CurrentUser Long userId, @PathVariable long appealId) {
        admin.requireAdmin(userId);
        admin.decideAppeal(appealId, true);
    }

    @PostMapping("/appeals/{appealId}/reject")
    public void rejectAppeal(@CurrentUser Long userId, @PathVariable long appealId) {
        admin.requireAdmin(userId);
        admin.decideAppeal(appealId, false);
    }

    @GetMapping("/reports")
    public List<AdminService.ReportRow> reports(@CurrentUser Long userId) {
        admin.requireAdmin(userId);
        return admin.reports();
    }

    @GetMapping("/contests")
    public List<AdminService.ContestRow> contests(@CurrentUser Long userId) {
        admin.requireAdmin(userId);
        return admin.contests();
    }

    @PostMapping("/contests")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> createContest(@CurrentUser Long userId, @RequestBody AdminService.ContestInput body) {
        admin.requireAdmin(userId);
        return Map.of("contestId", admin.createContest(body));
    }

    @PutMapping("/contests/{contestId}")
    public void updateContest(@CurrentUser Long userId, @PathVariable long contestId,
                              @RequestBody AdminService.ContestInput body) {
        admin.requireAdmin(userId);
        admin.updateContest(contestId, body);
    }

    @DeleteMapping("/contests/{contestId}")
    public void deleteContest(@CurrentUser Long userId, @PathVariable long contestId) {
        admin.requireAdmin(userId);
        admin.deleteContest(contestId);
    }
}
