package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.security.SecurityConstants;
import com.alumniweb.alumniweb.service.AuditEventPublisher;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/developer/audit")
@PreAuthorize("hasRole('" + SecurityConstants.ROLE_DEVELOPER + "')")
public class AuditStreamController {

    private final AuditEventPublisher auditEventPublisher;

    public AuditStreamController(AuditEventPublisher auditEventPublisher) {
        this.auditEventPublisher = auditEventPublisher;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return auditEventPublisher.subscribe();
    }
}
