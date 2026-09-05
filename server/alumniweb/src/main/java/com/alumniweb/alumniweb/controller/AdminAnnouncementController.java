package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.announcement.AnnouncementResponse;
import com.alumniweb.alumniweb.dto.announcement.CreateAnnouncementRequest;
import com.alumniweb.alumniweb.dto.announcement.UpdateAnnouncementRequest;
import com.alumniweb.alumniweb.security.SecurityConstants;
import com.alumniweb.alumniweb.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('" + SecurityConstants.ROLE_ADMIN + "')")
@RequiredArgsConstructor
public class AdminAnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping("/announcements")
    public ResponseEntity<List<AnnouncementResponse>> listAnnouncements() {
        return ResponseEntity.ok(announcementService.listAnnouncements(true));
    }

    @GetMapping("/announcements/{id}")
    public ResponseEntity<AnnouncementResponse> getAnnouncement(@PathVariable Long id) {
        return ResponseEntity.ok(announcementService.getAnnouncement(id));
    }

    @PostMapping("/announcements")
    public ResponseEntity<AnnouncementResponse> createAnnouncement(@RequestBody CreateAnnouncementRequest request) {
        return ResponseEntity.ok(announcementService.createAnnouncement(request));
    }

    @PutMapping("/announcements/{id}")
    public ResponseEntity<AnnouncementResponse> updateAnnouncement(
            @PathVariable Long id, @RequestBody UpdateAnnouncementRequest request) {
        return ResponseEntity.ok(announcementService.updateAnnouncement(id, request));
    }

    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<Map<String, String>> deleteAnnouncement(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
        return ResponseEntity.ok(Map.of("message", "Announcement deleted", "status", "deleted"));
    }
}
