package com.gdgoc.et.user;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    public List<UserSummary> listForSwitcher() {
        return userRepository.findAllByOrderByCreatedAtDescIdAsc().stream()
                .map(UserSummary::from)
                .toList();
    }
}
