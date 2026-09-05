package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.dashboard.DashboardResponse;
import com.alumniweb.alumniweb.model.Connection;
import com.alumniweb.alumniweb.model.Event;
import com.alumniweb.alumniweb.model.Notification;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.enums.EventStatus;
import com.alumniweb.alumniweb.model.repository.AlumniMessageRepository;
import com.alumniweb.alumniweb.model.repository.ConnectionRepository;
import com.alumniweb.alumniweb.model.repository.EventRepository;
import com.alumniweb.alumniweb.model.repository.MasterAlumniRepository;
import com.alumniweb.alumniweb.model.repository.NotificationRepository;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.service.impl.DashboardServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private MasterAlumniRepository masterAlumniRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private ConnectionRepository connectionRepository;
    @Mock
    private AlumniMessageRepository alumniMessageRepository;
    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    private static final long USER_ID = 22L;

    private void stubUserFound() {
        User user = new User();
        user.setId(USER_ID);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
    }

    private void stubNoEvents() {
        when(eventRepository.findByStatusAndEventDateGreaterThanEqualOrderByEventDateAsc(
                eq(EventStatus.PUBLISHED), any(LocalDateTime.class))).thenReturn(List.of());
    }

    private void stubNoConnections() {
        when(connectionRepository.findByRequesterIdOrRecipientId(USER_ID, USER_ID)).thenReturn(List.of());
    }

    private void stubNoNotifications() {
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of());
    }

    @Test
    void countsComeFromRepositoriesNotHardcoded() {
        stubUserFound();
        when(masterAlumniRepository.count()).thenReturn(25L);
        stubNoEvents();
        stubNoConnections();
        when(alumniMessageRepository.countByReceiverIdAndIsReadFalse(USER_ID)).thenReturn(3L);
        stubNoNotifications();

        DashboardResponse response = dashboardService.getDashboard(USER_ID);

        assertEquals(25, response.totalAlumni());
        assertEquals(0, response.upcomingEvents());
        assertEquals(0, response.activeConnections());
        assertEquals(3, response.unreadMessages());
        assertEquals(0, response.recentEvents().size());
        assertEquals(0, response.recentActivities().size());
    }

    @Test
    void onlyAcceptedConnectionsCounted() {
        stubUserFound();
        when(masterAlumniRepository.count()).thenReturn(0L);
        stubNoEvents();
        when(connectionRepository.findByRequesterIdOrRecipientId(USER_ID, USER_ID)).thenReturn(List.of(
                Connection.builder().status("ACCEPTED").build(),
                Connection.builder().status("ACCEPTED").build(),
                Connection.builder().status("PENDING").build(),
                Connection.builder().status("REJECTED").build()
        ));
        when(alumniMessageRepository.countByReceiverIdAndIsReadFalse(USER_ID)).thenReturn(0L);
        stubNoNotifications();

        DashboardResponse response = dashboardService.getDashboard(USER_ID);

        assertEquals(2, response.activeConnections());
    }

    @Test
    void recentEventsLimitedToThreeAndMapped() {
        stubUserFound();
        LocalDateTime future = LocalDateTime.now().plusDays(5);
        when(masterAlumniRepository.count()).thenReturn(0L);
        when(eventRepository.findByStatusAndEventDateGreaterThanEqualOrderByEventDateAsc(
                eq(EventStatus.PUBLISHED), any(LocalDateTime.class))).thenReturn(List.of(
                Event.builder().id(10L).title("Annual Meetup").eventDate(future).venue("Main Auditorium").build(),
                Event.builder().id(11L).title("Networking Mixer").eventDate(future.plusDays(1)).venue(null).build(),
                Event.builder().id(12L).title("Alumni Webinar").eventDate(future.plusDays(2)).venue("Online").build(),
                Event.builder().id(13L).title("Fourth Event").eventDate(future.plusDays(3)).venue("Room 1").build()
        ));
        stubNoConnections();
        when(alumniMessageRepository.countByReceiverIdAndIsReadFalse(USER_ID)).thenReturn(0L);
        stubNoNotifications();

        DashboardResponse response = dashboardService.getDashboard(USER_ID);

        assertEquals(4, response.upcomingEvents());
        assertEquals(3, response.recentEvents().size());
        DashboardResponse.RecentEvent first = response.recentEvents().get(0);
        assertEquals("10", first.id());
        assertEquals("Annual Meetup", first.title());
        assertEquals(future.format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, h:mm a")),
                first.date());
        assertEquals("Main Auditorium", first.location());
        assertEquals("", response.recentEvents().get(1).location());
    }

    @Test
    void recentActivitiesLimitedToFiveAndUseMessageFallbackToTitle() {
        stubUserFound();
        when(masterAlumniRepository.count()).thenReturn(0L);
        stubNoEvents();
        stubNoConnections();
        when(alumniMessageRepository.countByReceiverIdAndIsReadFalse(USER_ID)).thenReturn(0L);

        LocalDateTime now = LocalDateTime.now();
        List<Notification> six = List.of(
                Notification.builder().id(1L).title("T1").message("m1").createdAt(now).build(),
                Notification.builder().id(2L).title("T2").message("m2").createdAt(now).build(),
                Notification.builder().id(3L).title("T3").message("m3").createdAt(now).build(),
                Notification.builder().id(4L).title("T4").message("m4").createdAt(now).build(),
                Notification.builder().id(5L).title("T5").message("m5").createdAt(now).build(),
                Notification.builder().id(6L).title("T6").message("m6").createdAt(now).build()
        );
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(six);

        DashboardResponse response = dashboardService.getDashboard(USER_ID);

        assertEquals(5, response.recentActivities().size());
        assertEquals("1", response.recentActivities().get(0).id());
        assertEquals("m1", response.recentActivities().get(0).description());
    }

    @Test
    void blankMessageFallsBackToTitle() {
        stubUserFound();
        when(masterAlumniRepository.count()).thenReturn(0L);
        stubNoEvents();
        stubNoConnections();
        when(alumniMessageRepository.countByReceiverIdAndIsReadFalse(USER_ID)).thenReturn(0L);

        LocalDateTime now = LocalDateTime.now();
        Notification noMessage = Notification.builder()
                .id(7L)
                .title("System maintenance")
                .message("   ")
                .createdAt(now)
                .build();
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of(noMessage));

        DashboardResponse response = dashboardService.getDashboard(USER_ID);

        assertEquals(1, response.recentActivities().size());
        assertEquals("System maintenance", response.recentActivities().get(0).description());
    }

    @Test
    void unknownUserThrows() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> dashboardService.getDashboard(999L));

        verify(masterAlumniRepository, never()).count();
        verify(eventRepository, never())
                .findByStatusAndEventDateGreaterThanEqualOrderByEventDateAsc(EventStatus.PUBLISHED, LocalDateTime.now());
    }
}
