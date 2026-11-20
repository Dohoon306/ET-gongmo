package com.gdgoc.et.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.gdgoc.et.common.error.GlobalExceptionHandler;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class UserControllerTest {

    private final UserRepository userRepository = mock(UserRepository.class);

    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new UserController(userRepository))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

    @Test
    void listsIdAndNameInRepositoryOrderWithoutCurrentUserHeader() throws Exception {
        when(userRepository.findAllByOrderByCreatedAtDescIdAsc())
                .thenReturn(List.of(new User("새싹", "자기소개"), new User("방장 김", null)));

        mvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("새싹"))
                .andExpect(jsonPath("$[1].name").value("방장 김"))
                .andExpect(jsonPath("$[0].intro").doesNotExist());
    }

    @Test
    void signUpSavesUserAndReturnsIdAndName() throws Exception {
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 8L);
            return saved;
        });

        mvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \" 새싹 \", \"intro\": \"자바로 과제를 해봤어요\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(8))
                .andExpect(jsonPath("$.name").value("새싹"))
                .andExpect(jsonPath("$.intro").doesNotExist());

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getIntro()).isEqualTo("자바로 과제를 해봤어요");
    }

    @Test
    void signUpWithoutNameIsBadRequest() throws Exception {
        mvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \" \", \"intro\": \"자기소개\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void signUpWithNameLongerThan30IsBadRequest() throws Exception {
        String name = "가".repeat(31);

        mvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"" + name + "\", \"intro\": \"자기소개\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("name: 이름은 30자 이하로 입력해 주세요"));

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void signUpWithoutIntroIsBadRequest() throws Exception {
        mvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"새싹\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("intro: 자기소개를 입력해 주세요"));
    }
}
