package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.dashboard.DashboardResponse;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.enums.AccountStatus;
import com.alumniweb.alumniweb.model.enums.UserRole;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.security.CustomUserDetails;
import com.alumniweb.alumniweb.service.AuditEventPublisher;
import com.alumniweb.alumniweb.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DashboardController.class)
@AutoConfigureMockMvc(addFilters = false)
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @MockBean
    private AuditEventPublisher auditEventPublisher;

    @MockBean
    private UserRepository userRepository;

    @BeforeEach
    void setAuthUser() {
        User user = new User();
        user.setId(7L);
        user.setUsername("alumni");
        user.setPasswordHash("hashed");
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setRole(UserRole.USER);

        CustomUserDetails userDetails = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities()));
    }

    @Test
    void getDashboard_returnsClientShape() throws Exception {
        DashboardResponse response = new DashboardResponse(
                128,
                3,
                48,
                12,
                List.of(
                        new DashboardResponse.RecentEvent("1", "Annual Alumni Meetup 2026", "2026-08-15", "Main Auditorium"),
                        new DashboardResponse.RecentEvent("2", "Networking Mixer", "2026-08-22", "Innovation Lab")
                ),
                List.of(
                        new DashboardResponse.RecentActivity("act-1", "You connected with Sarah Johnson", "2026-08-03T07:00:00"),
                        new DashboardResponse.RecentActivity("act-2", "RSVP'd for Alumni Meetup", "2026-08-02T07:00:00")
                )
        );

        when(dashboardService.getDashboard(anyLong())).thenReturn(response);

        mockMvc.perform(get("/api/dashboard")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAlumni").value(128))
                .andExpect(jsonPath("$.upcomingEvents").value(3))
                .andExpect(jsonPath("$.activeConnections").value(48))
                .andExpect(jsonPath("$.unreadMessages").value(12))
                .andExpect(jsonPath("$.recentEvents[0].id").value("1"))
                .andExpect(jsonPath("$.recentEvents[0].title").value("Annual Alumni Meetup 2026"))
                .andExpect(jsonPath("$.recentEvents[0].date").value("2026-08-15"))
                .andExpect(jsonPath("$.recentEvents[0].location").value("Main Auditorium"))
                .andExpect(jsonPath("$.recentActivities[0].id").value("act-1"))
                .andExpect(jsonPath("$.recentActivities[0].description").value("You connected with Sarah Johnson"))
                .andExpect(jsonPath("$.recentActivities[0].timestamp").value("2026-08-03T07:00:00"));
    }
}