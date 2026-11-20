package com.gdgoc.et.user;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CategorySelectionRequest(
        @NotEmpty(message = "태그를 하나 이상 골라 주세요")
        List<Long> categoryIds) {
}
