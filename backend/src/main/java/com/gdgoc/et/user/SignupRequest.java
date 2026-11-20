package com.gdgoc.et.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank(message = "이름을 입력해 주세요")
        @Size(max = 30, message = "이름은 30자 이하로 입력해 주세요")
        String name,
        @NotBlank(message = "자기소개를 입력해 주세요")
        String intro) {

    public User toUser() {
        return new User(name.strip(), intro.strip());
    }
}
