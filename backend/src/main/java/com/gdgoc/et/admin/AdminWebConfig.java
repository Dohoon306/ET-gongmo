package com.gdgoc.et.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class AdminWebConfig implements WebMvcConfigurer {

    private final ObjectProvider<JdbcTemplate> jdbc;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SuspensionInterceptor(jdbc)).addPathPatterns("/api/**");
    }
}
