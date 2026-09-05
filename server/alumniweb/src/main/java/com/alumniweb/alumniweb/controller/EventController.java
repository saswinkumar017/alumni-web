package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.event.EventResponse;
import com.alumniweb.alumniweb.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<List<EventResponse>> listEvents() {
        return ResponseEntity.ok(eventService.listEvents(false));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<EventResponse>> getUpcoming() {
        return ResponseEntity.ok(eventService.getUpcoming());
    }

    @GetMapping("/past")
    public ResponseEntity<List<EventResponse>> getPast() {
        return ResponseEntity.ok(eventService.getPast());
    }

    @GetMapping("/search")
    public ResponseEntity<List<EventResponse>> searchEvents(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(eventService.searchEvents(q));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<EventResponse> getEvent(@PathVariable String slug) {
        return ResponseEntity.ok(eventService.getEvent(slug, false));
    }
}
