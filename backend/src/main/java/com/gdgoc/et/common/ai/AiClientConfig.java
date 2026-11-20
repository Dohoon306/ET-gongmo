package com.gdgoc.et.common.ai;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(AiProperties.class)
class AiClientConfig {

    @Bean
    AiClient aiClient(AiProperties properties, RestClient.Builder restClientBuilder) {
        if (!properties.hasApiKey()) {
            return new FallbackAiClient();
        }
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(properties.timeout());
        requestFactory.setReadTimeout(properties.timeout());
        RestClient restClient = restClientBuilder.requestFactory(requestFactory).build();
        return new OpenAiClient(restClient, properties.apiKey().strip(), properties.model());
    }
}
