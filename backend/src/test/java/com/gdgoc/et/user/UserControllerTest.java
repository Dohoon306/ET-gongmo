package com.gdgoc.et.user;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class UserControllerTest {

    private final UserRepository userRepository = mock(UserRepository.class);

    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new UserController(userRepository)).build();

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
}
