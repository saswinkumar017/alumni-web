package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.announcement.AnnouncementResponse;
import com.alumniweb.alumniweb.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping
    public ResponseEntity<List<AnnouncementResponse>> listAnnouncements() {
        return ResponseEntity.ok(announcementService.listAnnouncements(false));
    }

    @GetMapping("/featured")
    public ResponseEntity<List<AnnouncementResponse>> listFeaturedAnnouncements() {
        return ResponseEntity.ok(announcementService.listFeaturedAnnouncements());
    }
}
