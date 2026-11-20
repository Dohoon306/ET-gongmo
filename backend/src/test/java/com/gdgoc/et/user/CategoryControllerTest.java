package com.gdgoc.et.user;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CategoryControllerTest {

    private final CategoryRepository categoryRepository = mock(CategoryRepository.class);

    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new CategoryController(categoryRepository)).build();

    @Test
    void returnsEveryFieldWithoutCurrentUserHeader() throws Exception {
        when(categoryRepository.findAll())
                .thenReturn(List.of(new Category(13L, CategoryAxis.ROLE, "backend", "백엔드", 1)));

        mvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(13))
                .andExpect(jsonPath("$[0].axis").value("ROLE"))
                .andExpect(jsonPath("$[0].code").value("backend"))
                .andExpect(jsonPath("$[0].name").value("백엔드"))
                .andExpect(jsonPath("$[0].sortOrder").value(1));
    }

    @Test
    void sortsByAxisOrderThenSortOrderRegardlessOfRepositoryOrder() throws Exception {
        List<Category> reversed = new ArrayList<>(CategoryCatalog.ALL.stream().map(Category::from).toList());
        Collections.reverse(reversed);
        when(categoryRepository.findAll()).thenReturn(reversed);

        mvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(31))
                .andExpect(jsonPath("$[0].code").value("it"))
                .andExpect(jsonPath("$[11].code").value("etc"))
                .andExpect(jsonPath("$[12].code").value("backend"))
                .andExpect(jsonPath("$[18].code").value("java"))
                .andExpect(jsonPath("$[25].code").value("beginner"))
                .andExpect(jsonPath("$[28].code").value("learn"))
                .andExpect(jsonPath("$[30].code").value("award"));
    }
}
