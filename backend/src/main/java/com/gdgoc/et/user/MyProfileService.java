package com.gdgoc.et.user;

import com.gdgoc.et.common.error.ApiException;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeSet;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MyProfileService {

    private static final Map<Long, CategorySeed> SEED_BY_ID = CategoryCatalog.ALL.stream()
            .collect(Collectors.toUnmodifiableMap(CategorySeed::id, Function.identity()));

    private final UserRepository userRepository;
    private final CategorySuggester categorySuggester;

    @Transactional(readOnly = true)
    public CategorySuggestionResponse suggestCategories(Long userId) {
        User user = findUser(userId);
        return new CategorySuggestionResponse(
                user.getName(), user.getIntro(), categorySuggester.suggest(user.getIntro()));
    }

    @Transactional
    public UserSummary rewriteProfile(Long userId, SignupRequest request) {
        User user = findUser(userId);
        user.rewriteProfile(request.name().strip(), request.intro().strip());
        return UserSummary.from(user);
    }

    @Transactional
    public List<Long> confirmCategories(Long userId, List<Long> categoryIds) {
        if (categoryIds.stream().anyMatch(Objects::isNull) || !SEED_BY_ID.keySet().containsAll(categoryIds)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "목록에 없는 태그는 고를 수 없어요");
        }
        TreeSet<Long> confirmed = new TreeSet<>(categoryIds);
        long levelCount = confirmed.stream()
                .filter(id -> SEED_BY_ID.get(id).axis() == CategoryAxis.LEVEL)
                .count();
        if (levelCount > 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "수준 태그는 하나만 골라 주세요");
        }
        findUser(userId).confirmCategories(confirmed);
        return List.copyOf(confirmed);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없어요"));
    }
}
