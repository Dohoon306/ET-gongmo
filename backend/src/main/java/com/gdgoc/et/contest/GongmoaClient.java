package com.gdgoc.et.contest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
class GongmoaClient {

    private static final String USER_AGENT = "ET-gongmo-contest-collector/1.0";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    GongmoaClient(RestClient.Builder builder, ObjectMapper objectMapper, ContestCollectionProperties properties) {
        this.restClient = builder.baseUrl(properties.endpoint()).build();
        this.objectMapper = objectMapper;
    }

    String searchContests(String field, String target, int limit) {
        return call("search_contests", Map.of("type", "contest", "field", List.of(field), "target", List.of(target), "sort", "due", "limit", limit));
    }

    String getContest(long gongmoaId) {
        return call("get_contest", Map.of("id", gongmoaId));
    }

    private String call(String tool, Map<String, Object> arguments) {
        String response = restClient.post()
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON, MediaType.TEXT_EVENT_STREAM)
                .header("User-Agent", USER_AGENT)
                .body(Map.of("jsonrpc", "2.0", "id", 1, "method", "tools/call", "params", Map.of("name", tool, "arguments", arguments)))
                .retrieve()
                .body(String.class);
        return extractText(response == null ? "" : response);
    }

    private String extractText(String response) {
        for (String line : response.split("\\R")) {
            if (line.startsWith("data:")) {
                String text = resultText(line.substring(5).strip());
                if (!text.isBlank()) {
                    return text;
                }
            }
        }
        return resultText(response);
    }

    private String resultText(String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            return root.at("/result/content/0/text").asText("");
        } catch (Exception exception) {
            throw new IllegalStateException("공모아뷰 MCP 응답을 읽지 못했습니다.", exception);
        }
    }
}
