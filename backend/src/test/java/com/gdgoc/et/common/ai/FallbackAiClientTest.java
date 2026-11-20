package com.gdgoc.et.common.ai;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class FallbackAiClientTest {

    @Test
    void returnsFallbackAsIs() {
        assertThat(new FallbackAiClient().ask("프롬프트", "대체 응답")).isEqualTo("대체 응답");
    }
}
