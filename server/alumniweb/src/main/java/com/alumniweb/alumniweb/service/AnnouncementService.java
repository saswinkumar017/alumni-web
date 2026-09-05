package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.announcement.AnnouncementResponse;
import com.alumniweb.alumniweb.dto.announcement.CreateAnnouncementRequest;
import com.alumniweb.alumniweb.dto.announcement.UpdateAnnouncementRequest;
import com.alumniweb.alumniweb.model.Announcement;
import com.alumniweb.alumniweb.model.AuditLog;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.enums.AuditCategory;
import com.alumniweb.alumniweb.model.enums.AuditLogLevel;
import com.alumniweb.alumniweb.model.repository.AnnouncementRepository;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;
    private final AuditEventPublisher auditEventPublisher;

    public List<AnnouncementResponse> listAnnouncements(boolean includeInactive) {
        List<Announcement> announcements = includeInactive
                ? announcementRepository.findAllByOrderByCreatedAtDesc()
                : announcementRepository.findByIsActiveTrueOrderByCreatedAtDesc();
        return announcements.stream().map(AnnouncementResponse::from).toList();
    }

    public List<AnnouncementResponse> listFeaturedAnnouncements() {
        return announcementRepository.findByIsActiveTrueAndFeaturedTrueOrderByCreatedAtDesc()
                .stream().map(AnnouncementResponse::from).toList();
    }

    public AnnouncementResponse getAnnouncement(Long id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Announcement not found with id: " + id));
        return AnnouncementResponse.from(announcement);
    }

    @Transactional
    public AnnouncementResponse createAnnouncement(CreateAnnouncementRequest request) {
        Announcement announcement = Announcement.builder()
                .title(request.title())
                .body(request.body())
                .authorName(currentAuthor())
                .featured(request.featured())
                .isActive(true)
                .tags(joinTags(request.tags()))
                .createdBy(SecurityUtils.getCurrentUserId())
                .build();

        Announcement saved = announcementRepository.save(announcement);

        publishAudit(currentUser(), "CREATE_ANNOUNCEMENT", saved, null);
        return AnnouncementResponse.from(saved);
    }

    @Transactional
    public AnnouncementResponse updateAnnouncement(Long id, UpdateAnnouncementRequest request) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Announcement not found with id: " + id));

        String oldValues = toJson(announcement);

        if (request.title() != null) {
            announcement.setTitle(request.title());
        }
        if (request.body() != null) {
            announcement.setBody(request.body());
        }
        if (request.featured() != null) {
            announcement.setFeatured(request.featured());
        }
        if (request.isActive() != null) {
            announcement.setActive(request.isActive());
        }
        if (request.tags() != null) {
            announcement.setTags(joinTags(request.tags()));
        }

        Announcement saved = announcementRepository.save(announcement);

        publishAudit(currentUser(), "UPDATE_ANNOUNCEMENT", saved, oldValues);
        return AnnouncementResponse.from(saved);
    }

    @Transactional
    public void deleteAnnouncement(Long id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Announcement not found with id: " + id));

        String oldValues = toJson(announcement);
        announcementRepository.delete(announcement);

        publishAudit(currentUser(), "DELETE_ANNOUNCEMENT", announcement, oldValues);
    }

    private String joinTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return null;
        }
        return String.join(",", tags.stream()
                .map(String::trim)
                .filter(t -> !t.isEmpty())
                .toList());
    }

    private String currentAuthor() {
        User user = currentUser();
        return user != null ? user.getUsername() : "Admin";
    }

    private User currentUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        return userId == null ? null : userRepository.findById(userId).orElse(null);
    }

    private void publishAudit(User user, String action, Announcement announcement, String oldValues) {
        auditEventPublisher.publish(AuditLog.builder()
                .user(user)
                .action(action)
                .category(AuditCategory.USER_ACTION)
                .logLevel(AuditLogLevel.INFO)
                .entityType("Announcement")
                .entityId(announcement.getId())
                .oldValues(oldValues)
                .newValues(toJson(announcement))
                .build());
    }

    private String toJson(Announcement announcement) {
        return "{\"title\":\"" + escape(announcement.getTitle())
                + "\",\"featured\":" + announcement.isFeatured()
                + ",\"active\":" + announcement.isActive() + "}";
    }

    private String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
