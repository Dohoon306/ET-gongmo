package com.gdgoc.et.user;

public record UserSummary(Long id, String name) {

    public static UserSummary from(User user) {
        return new UserSummary(user.getId(), user.getName());
    }
}
