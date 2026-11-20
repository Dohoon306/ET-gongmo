package com.gdgoc.et.user;

import com.gdgoc.et.common.web.CurrentUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class MyProfileController {

    private final MyProfileService myProfileService;

    @GetMapping("/category-suggestion")
    public CategorySuggestionResponse suggestCategories(@CurrentUser Long userId) {
        return myProfileService.suggestCategories(userId);
    }

    @PutMapping
    public UserSummary rewriteProfile(@CurrentUser Long userId, @Valid @RequestBody SignupRequest request) {
        return myProfileService.rewriteProfile(userId, request);
    }

    @PutMapping("/categories")
    public List<Long> confirmCategories(
            @CurrentUser Long userId, @Valid @RequestBody CategorySelectionRequest request) {
        return myProfileService.confirmCategories(userId, request.categoryIds());
    }
}
