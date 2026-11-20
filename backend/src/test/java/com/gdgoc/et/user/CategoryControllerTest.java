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
                .andExpect(jsonPath("$[0].sortOrder").value(1))
                .andExpect(jsonPath("$[0].fieldCodes.length()").value(1))
                .andExpect(jsonPath("$[0].fieldCodes[0]").value("it"));
    }

    @Test
    void sortsByAxisOrderThenSortOrderRegardlessOfRepositoryOrder() throws Exception {
        List<Category> reversed = new ArrayList<>(CategoryCatalog.ALL.stream().map(Category::from).toList());
        Collections.reverse(reversed);
        when(categoryRepository.findAll()).thenReturn(reversed);

        mvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(71))
                .andExpect(jsonPath("$[0].code").value("it"))
                .andExpect(jsonPath("$[0].fieldCodes.length()").value(0))
                .andExpect(jsonPath("$[11].code").value("etc"))
                .andExpect(jsonPath("$[12].code").value("backend"))
                .andExpect(jsonPath("$[18].code").value("graphic_design"))
                .andExpect(jsonPath("$[25].code").value("presentation"))
                .andExpect(jsonPath("$[26].code").value("branding"))
                .andExpect(jsonPath("$[40].code").value("mentoring"))
                .andExpect(jsonPath("$[41].code").value("java"))
                .andExpect(jsonPath("$[48].code").value("photoshop"))
                .andExpect(jsonPath("$[53].code").value("excel"))
                .andExpect(jsonPath("$[54].code").value("indesign"))
                .andExpect(jsonPath("$[64].code").value("notion"))
                .andExpect(jsonPath("$[65].code").value("beginner"))
                .andExpect(jsonPath("$[68].code").value("learn"))
                .andExpect(jsonPath("$[70].code").value("award"));
    }
}
