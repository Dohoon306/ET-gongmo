package com.gdgoc.et.admin;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.servlet.HandlerInterceptor;

@RequiredArgsConstructor
public class SuspensionInterceptor implements HandlerInterceptor {

    static final String MESSAGE = "정지된 계정이에요. 관리자가 정지를 풀 때까지 이용할 수 없어요";

    private static final Set<String> OPEN_GET_PATHS = Set.of("/api/users", "/api/health", "/api/categories",
            "/api/admin/status");

    private final ObjectProvider<JdbcTemplate> jdbc;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("GET".equals(request.getMethod()) && OPEN_GET_PATHS.contains(request.getRequestURI())) {
            return true;
        }
        Long userId = parseUserId(request.getHeader("X-User-Id"));
        if (userId == null || !isSuspended(userId)) {
            return true;
        }
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"message\":\"" + MESSAGE + "\"}");
        return false;
    }

    private boolean isSuspended(long userId) {
        JdbcTemplate template = jdbc.getIfAvailable();
        if (template == null) {
            return false;
        }
        Integer count = template.queryForObject("SELECT COUNT(*) FROM user_suspension WHERE user_id = ?", Integer.class, userId);
        return count != null && count > 0;
    }

    static Long parseUserId(String header) {
        if (header == null || header.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(header.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
