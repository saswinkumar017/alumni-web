package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.search.AlumniProfileResponse;
import com.alumniweb.alumniweb.exception.AlumniNotFoundException;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.service.AlumniSearchService;
import com.alumniweb.alumniweb.service.AuditEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AlumniController.class)
@AutoConfigureMockMvc(addFilters = false)
class AlumniControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AlumniSearchService alumniSearchService;

    @MockBean
    private AuditEventPublisher auditEventPublisher;

    @MockBean
    private UserRepository userRepository;

    private AlumniProfileResponse profile;

    @BeforeEach
    void setUp() {
        profile = new AlumniProfileResponse(
                "42",            // id
                "CS101",         // slug
                "Aarav Kumar",   // name
                "2025",          // batch
                "CSE",           // department
                "Biofeedback",
                null,            // avatar
                "Engineering",
                "Software Engineer",
                "JJCET"
        );
    }

    @Test
    void getProfileBySlug_returnsAlumniProfile() throws Exception {
        when(alumniSearchService.getAlumniProfile("CS101")).thenReturn(profile);

        mockMvc.perform(get("/api/alumni/CS101").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("42"))
                .andExpect(jsonPath("$.slug").value("CS101"))
                .andExpect(jsonPath("$.name").value("Aarav Kumar"))
                .andExpect(jsonPath("$.batch").value("2025"))
                .andExpect(jsonPath("$.department").value("CSE"))
                .andExpect(jsonPath("$.bio").value("Biofeedback"))
                .andExpect(jsonPath("$.location").value("Engineering"))
                .andExpect(jsonPath("$.jobTitle").value("Software Engineer"))
                .andExpect(jsonPath("$.company").value("JJCET"));
    }

    @Test
    void getProfileBySlug_returns404WhenMissing() throws Exception {
        when(alumniSearchService.getAlumniProfile(anyString()))
                .thenThrow(new AlumniNotFoundException("CS101"));

        mockMvc.perform(get("/api/alumni/CS101").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void getAllAlumniProfiles_returnsArray() throws Exception {
        when(alumniSearchService.getAllAlumniProfiles()).thenReturn(List.of(profile));

        mockMvc.perform(get("/api/alumni").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").value("CS101"))
                .andExpect(jsonPath("$[0].name").value("Aarav Kumar"));
    }
}