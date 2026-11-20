package com.gdgoc.et.contest;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.contest-classification")
public record ContestClassificationProperties(long heroGongmoaId) {
}
