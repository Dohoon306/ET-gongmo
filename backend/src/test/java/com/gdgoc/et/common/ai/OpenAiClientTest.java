package com.gdgoc.et.common.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.net.SocketTimeoutException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class OpenAiClientTest {

    private static final String FALLBACK = "대체 응답";

    private MockRestServiceServer server;
    private OpenAiClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        client = new OpenAiClient(builder.build(), "test-key", "test-model");
    }

    @Test
    void returnsAssistantMessageContent() {
        server.expect(requestTo(OpenAiClient.CHAT_COMPLETIONS_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer test-key"))
                .andExpect(jsonPath("$.model").value("test-model"))
                .andExpect(jsonPath("$.messages[0].role").value("user"))
                .andExpect(jsonPath("$.messages[0].content").value("자기소개를 분류해 줘"))
                .andRespond(withSuccess("""
                        {
                          "id": "chatcmpl-1",
                          "object": "chat.completion",
                          "choices": [
                            {
                              "index": 0,
                              "message": {"role": "assistant", "content": "IT, 백엔드, Java", "refusal": null},
                              "finish_reason": "stop"
                            }
                          ]
                        }
                        """, MediaType.APPLICATION_JSON));

        assertThat(client.ask("자기소개를 분류해 줘", FALLBACK)).isEqualTo("IT, 백엔드, Java");
        server.verify();
    }

    @Test
    void returnsFallbackOnServerError() {
        server.expect(requestTo(OpenAiClient.CHAT_COMPLETIONS_URL)).andRespond(withServerError());

        assertThat(client.ask("프롬프트", FALLBACK)).isEqualTo(FALLBACK);
    }

    @Test
    void returnsFallbackOnUnauthorized() {
        server.expect(requestTo(OpenAiClient.CHAT_COMPLETIONS_URL))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED));

        assertThat(client.ask("프롬프트", FALLBACK)).isEqualTo(FALLBACK);
    }

    @Test
    void returnsFallbackOnTimeout() {
        server.expect(requestTo(OpenAiClient.CHAT_COMPLETIONS_URL))
                .andRespond(withException(new SocketTimeoutException("Read timed out")));

        assertThat(client.ask("프롬프트", FALLBACK)).isEqualTo(FALLBACK);
    }

    @Test
    void returnsFallbackWhenChoicesAreEmpty() {
        server.expect(requestTo(OpenAiClient.CHAT_COMPLETIONS_URL))
                .andRespond(withSuccess("{\"choices\": []}", MediaType.APPLICATION_JSON));

        assertThat(client.ask("프롬프트", FALLBACK)).isEqualTo(FALLBACK);
    }

    @Test
    void returnsFallbackWhenContentIsBlank() {
        server.expect(requestTo(OpenAiClient.CHAT_COMPLETIONS_URL))
                .andRespond(withSuccess(
                        "{\"choices\": [{\"message\": {\"role\": \"assistant\", \"content\": \"  \"}}]}",
                        MediaType.APPLICATION_JSON));

        assertThat(client.ask("프롬프트", FALLBACK)).isEqualTo(FALLBACK);
    }

    @Test
    void returnsFallbackWhenContentIsNull() {
        server.expect(requestTo(OpenAiClient.CHAT_COMPLETIONS_URL))
                .andRespond(withSuccess(
                        "{\"choices\": [{\"message\": {\"role\": \"assistant\", \"content\": null}}]}",
                        MediaType.APPLICATION_JSON));

        assertThat(client.ask("프롬프트", FALLBACK)).isEqualTo(FALLBACK);
    }

    @Test
    void returnsFallbackWhenBodyIsNotJson() {
        server.expect(requestTo(OpenAiClient.CHAT_COMPLETIONS_URL))
                .andRespond(withSuccess("<html>", MediaType.APPLICATION_JSON));

        assertThat(client.ask("프롬프트", FALLBACK)).isEqualTo(FALLBACK);
    }
}
