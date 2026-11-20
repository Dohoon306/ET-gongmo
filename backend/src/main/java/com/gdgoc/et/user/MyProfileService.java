package com.gdgoc.et.user;

import com.gdgoc.et.common.error.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MyProfileService {

    private final UserRepository userRepository;
    private final CategorySuggester categorySuggester;

    @Transactional(readOnly = true)
    public CategorySuggestionResponse suggestCategories(Long userId) {
        User user = findUser(userId);
        return new CategorySuggestionResponse(
                user.getName(), user.getIntro(), categorySuggester.suggest(user.getIntro()));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없어요"));
    }
}
