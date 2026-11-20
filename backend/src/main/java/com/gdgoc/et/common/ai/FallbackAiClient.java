package com.gdgoc.et.common.ai;

class FallbackAiClient implements AiClient {

    @Override
    public String ask(String prompt, String fallback) {
        return fallback;
    }
}
