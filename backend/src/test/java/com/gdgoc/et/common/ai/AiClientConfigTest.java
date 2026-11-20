package com.gdgoc.et.common.ai;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.web.client.RestClient;

class AiClientConfigTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(AiClientConfig.class)
            .withBean(RestClient.Builder.class, RestClient::builder)
            .withPropertyValues("app.ai.model=test-model", "app.ai.timeout=5s");

    @Test
    void usesFallbackClientWhenApiKeyIsEmpty() {
        contextRunner.withPropertyValues("app.ai.api-key=").run(context -> {
            assertThat(context.getBean(AiClient.class)).isInstanceOf(FallbackAiClient.class);
            assertThat(context.getBean(AiClient.class).ask("프롬프트", "대체 응답")).isEqualTo("대체 응답");
        });
    }

    @Test
    void usesFallbackClientWhenApiKeyIsBlank() {
        contextRunner.withPropertyValues("app.ai.api-key=   ")
                .run(context -> assertThat(context.getBean(AiClient.class)).isInstanceOf(FallbackAiClient.class));
    }

    @Test
    void usesFallbackClientWhenApiKeyIsMissing() {
        contextRunner
                .run(context -> assertThat(context.getBean(AiClient.class)).isInstanceOf(FallbackAiClient.class));
    }

    @Test
    void usesOpenAiClientWhenApiKeyIsSet() {
        contextRunner.withPropertyValues("app.ai.api-key=test-key")
                .run(context -> assertThat(context.getBean(AiClient.class)).isInstanceOf(OpenAiClient.class));
    }
}
