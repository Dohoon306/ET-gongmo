package com.gdgoc.et.common.ai;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.ai")
record AiProperties(String apiKey, String model, Duration timeout) {

    boolean hasApiKey() {
        return apiKey != null && !apiKey.isBlank();
    }
}
