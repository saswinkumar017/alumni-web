package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.event.CreateEventRequest;
import com.alumniweb.alumniweb.dto.event.EventResponse;
import com.alumniweb.alumniweb.dto.event.UpdateEventRequest;
import com.alumniweb.alumniweb.model.AuditLog;
import com.alumniweb.alumniweb.model.Event;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.enums.AuditCategory;
import com.alumniweb.alumniweb.model.enums.AuditLogLevel;
import com.alumniweb.alumniweb.model.enums.EventStatus;
import com.alumniweb.alumniweb.model.repository.EventRepository;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventService {

    private static final Pattern SLUG_PATTERN = Pattern.compile("[a-z0-9]+(?:-[a-z0-9]+)*");

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final AuditEventPublisher auditEventPublisher;

    public List<EventResponse> listEvents(boolean includeDrafts) {
        if (includeDrafts) {
            return eventRepository.findAll().stream()
                    .sorted((a, b) -> b.getEventDate().compareTo(a.getEventDate()))
                    .map(EventResponse::from)
                    .toList();
        }
        return eventRepository.findByStatusOrderByEventDateDesc(EventStatus.PUBLISHED).stream()
                .map(EventResponse::from)
                .toList();
    }

    public List<EventResponse> getUpcoming() {
        return eventRepository.findByStatusAndEventDateGreaterThanEqualOrderByEventDateAsc(
                        EventStatus.PUBLISHED, LocalDateTime.now()).stream()
                .map(EventResponse::from)
                .toList();
    }

    public List<EventResponse> getPast() {
        return eventRepository.findByStatusAndEventDateLessThanOrderByEventDateDesc(
                        EventStatus.PUBLISHED, LocalDateTime.now()).stream()
                .map(EventResponse::from)
                .toList();
    }

    public EventResponse getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Event not found with id: " + id));
        return EventResponse.from(event);
    }

    public EventResponse getEvent(String slug, boolean includeDraft) {
        Event event = includeDraft
                ? eventRepository.findBySlug(slug)
                        .orElseThrow(() -> new NoSuchElementException("Event not found with slug: " + slug))
                : eventRepository.findBySlugAndStatus(slug, EventStatus.PUBLISHED)
                        .orElseThrow(() -> new NoSuchElementException("Event not found with slug: " + slug));
        return EventResponse.from(event);
    }

    public List<EventResponse> searchEvents(String query) {
        if (query == null || query.isBlank()) {
            return listEvents(false);
        }
        return eventRepository.findByStatusAndTitleContainingIgnoreCaseOrderByEventDateDesc(
                        EventStatus.PUBLISHED, query.trim()).stream()
                .map(EventResponse::from)
                .toList();
    }

    @Transactional
    public EventResponse createEvent(CreateEventRequest request) {
        String slug = resolveSlug(request.slug(), request.title());

        Event event = Event.builder()
                .slug(slug)
                .title(request.title())
                .description(request.description())
                .venue(request.venue())
                .eventDate(request.eventDate())
                .coverImageUrl(request.coverImageUrl())
                .status(request.status() != null ? request.status() : EventStatus.DRAFT)
                .maxAttendees(request.maxAttendees())
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        Event saved = eventRepository.save(event);

        publishAudit(currentUser(), "CREATE_EVENT", saved, null);
        return EventResponse.from(saved);
    }

    @Transactional
    public EventResponse updateEvent(Long id, UpdateEventRequest request) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Event not found with id: " + id));

        String oldValues = toJson(event);

        if (request.slug() != null && !request.slug().isBlank()) {
            event.setSlug(resolveSlug(request.slug(), null));
        }
        if (request.title() != null) {
            event.setTitle(request.title());
        }
        if (request.description() != null) {
            event.setDescription(request.description());
        }
        if (request.venue() != null) {
            event.setVenue(request.venue());
        }
        if (request.eventDate() != null) {
            event.setEventDate(request.eventDate());
        }
        if (request.coverImageUrl() != null) {
            event.setCoverImageUrl(request.coverImageUrl());
        }
        if (request.status() != null) {
            event.setStatus(request.status());
        }
        if (request.maxAttendees() != null) {
            event.setMaxAttendees(request.maxAttendees());
        }

        Event saved = eventRepository.save(event);

        publishAudit(currentUser(), "UPDATE_EVENT", saved, oldValues);
        return EventResponse.from(saved);
    }

    @Transactional
    public void deleteEvent(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Event not found with id: " + id));

        String oldValues = toJson(event);
        eventRepository.delete(event);

        publishAudit(currentUser(), "DELETE_EVENT", event, oldValues);
    }

    private String resolveSlug(String requestedSlug, String title) {
        String slug;
        if (requestedSlug != null && !requestedSlug.isBlank()) {
            slug = requestedSlug.trim().toLowerCase(Locale.ROOT);
            if (!SLUG_PATTERN.matcher(slug).matches()) {
                throw new IllegalArgumentException("Slug must contain only lowercase letters, numbers and hyphens");
            }
        } else {
            slug = slugify(title != null ? title : "event");
        }
        if (eventRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("An event with slug '" + slug + "' already exists");
        }
        return slug;
    }

    private String slugify(String value) {
        String base = value.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (base.isBlank()) {
            base = "event";
        }
        return base;
    }

    private User currentUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        return userId == null ? null : userRepository.findById(userId).orElse(null);
    }

    private void publishAudit(User user, String action, Event event, String oldValues) {
        auditEventPublisher.publish(AuditLog.builder()
                .user(user)
                .action(action)
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.INFO)
                .entityType("Event")
                .entityId(event.getId())
                .oldValues(oldValues)
                .newValues(toJson(event))
                .build());
    }

    private String toJson(Event event) {
        return "{\"title\":\"" + escape(event.getTitle()) + "\",\"slug\":\"" + escape(event.getSlug())
                + "\",\"status\":\"" + event.getStatus() + "\",\"date\":\"" + event.getEventDate() + "\"}";
    }

    private String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
