package com.gdgoc.et;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.gdgoc.et.common.error.GlobalExceptionHandler;
import com.gdgoc.et.common.web.CurrentUser;
import com.gdgoc.et.common.web.CurrentUserArgumentResolver;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

class CurrentUserArgumentResolverTest {

    @RestController
    static class EchoController {
        @GetMapping("/echo")
        String echo(@CurrentUser Long userId) {
            return String.valueOf(userId);
        }

        @GetMapping("/echo-primitive")
        String echoPrimitive(@CurrentUser long userId) {
            return String.valueOf(userId);
        }
    }

    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new EchoController())
            .setCustomArgumentResolvers(new CurrentUserArgumentResolver())
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

    @Test
    void readsHeader() throws Exception {
        String body = mvc.perform(get("/echo").header("X-User-Id", "7"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(body).isEqualTo("7");
    }

    @Test
    void readsHeaderIntoPrimitiveLongIgnoringQueryParameter() throws Exception {
        String body = mvc.perform(get("/echo-primitive").header("X-User-Id", "7").param("userId", "3"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(body).isEqualTo("7");
    }

    @Test
    void missingHeaderIs400() throws Exception {
        mvc.perform(get("/echo"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }
}
