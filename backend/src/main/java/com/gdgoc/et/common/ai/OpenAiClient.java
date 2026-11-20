package com.gdgoc.et.common.ai;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

@Slf4j
class OpenAiClient implements AiClient {

    static final String CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    OpenAiClient(RestClient restClient, String apiKey, String model) {
        this.restClient = restClient;
        this.apiKey = apiKey;
        this.model = model;
    }

    @Override
    public String ask(String prompt, String fallback) {
        try {
            String answer = extractAnswer(requestCompletion(prompt));
            return answer.isBlank() ? fallback : answer;
        } catch (RuntimeException e) {
            log.warn("AI 호출 실패, 대체 응답 사용: {}", e.toString());
            return fallback;
        }
    }

    private JsonNode requestCompletion(String prompt) {
        Map<String, Object> request = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", prompt)));
        return restClient.post()
                .uri(CHAT_COMPLETIONS_URL)
                .headers(headers -> headers.setBearerAuth(apiKey))
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(JsonNode.class);
    }

    private String extractAnswer(JsonNode completion) {
        if (completion == null) {
            return "";
        }
        return completion.at("/choices/0/message/content").asText("").strip();
    }
}
