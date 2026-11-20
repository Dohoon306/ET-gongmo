package com.gdgoc.et.user;

import java.util.List;

public record CategorySuggestionResponse(String name, String intro, List<Long> categoryIds) {
}
