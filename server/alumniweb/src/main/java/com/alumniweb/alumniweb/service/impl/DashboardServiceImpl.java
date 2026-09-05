package com.alumniweb.alumniweb.service.impl;

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
import com.alumniweb.alumniweb.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private static final DateTimeFormatter EVENT_DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy, h:mm a");
    private static final DateTimeFormatter ACTIVITY_DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy, h:mm a");
    private static final String CONNECTION_ACCEPTED = "ACCEPTED";

    private final UserRepository userRepository;
    private final MasterAlumniRepository masterAlumniRepository;
    private final EventRepository eventRepository;
    private final ConnectionRepository connectionRepository;
    private final AlumniMessageRepository alumniMessageRepository;
    private final NotificationRepository notificationRepository;

    @Override
    public DashboardResponse getDashboard(Long userId) {
        userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        int totalAlumni = (int) masterAlumniRepository.count();

        List<Event> upcomingEvents = eventRepository
            .findByStatusAndEventDateGreaterThanEqualOrderByEventDateAsc(EventStatus.PUBLISHED, LocalDateTime.now());

        long activeConnections = connectionRepository.findByRequesterIdOrRecipientId(userId, userId).stream()
            .map(Connection::getStatus)
            .filter(CONNECTION_ACCEPTED::equals)
            .count();

        long unreadMessages = alumniMessageRepository.countByReceiverIdAndIsReadFalse(userId);

        List<DashboardResponse.RecentEvent> recentEvents = upcomingEvents.stream()
            .limit(3)
            .map(event -> new DashboardResponse.RecentEvent(
                String.valueOf(event.getId()),
                event.getTitle(),
                event.getEventDate().format(EVENT_DATE_FORMAT),
                event.getVenue() != null ? event.getVenue() : ""
            ))
            .toList();

        List<DashboardResponse.RecentActivity> recentActivities = notificationRepository
            .findByUserIdOrderByCreatedAtDesc(userId).stream()
            .limit(5)
            .map(this::toRecentActivity)
            .toList();

        return new DashboardResponse(
            totalAlumni,
            upcomingEvents.size(),
            (int) activeConnections,
            (int) unreadMessages,
            recentEvents,
            recentActivities
        );
    }

    private DashboardResponse.RecentActivity toRecentActivity(Notification notification) {
        String description = notification.getMessage() != null && !notification.getMessage().isBlank()
            ? notification.getMessage()
            : notification.getTitle();
        return new DashboardResponse.RecentActivity(
            String.valueOf(notification.getId()),
            description,
            notification.getCreatedAt().format(ACTIVITY_DATE_FORMAT)
        );
    }
}
