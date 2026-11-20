package com.gdgoc.et.user;

import com.gdgoc.et.common.web.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
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
}
