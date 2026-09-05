package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.developer.AuditLogResponse;
import com.alumniweb.alumniweb.model.AuditLog;
import com.alumniweb.alumniweb.model.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditEventPublisher {

    private final AuditLogRepository auditLogRepository;
    private final CopyOnWriteArrayList<SseEmitter> subscribers = new CopyOnWriteArrayList<>();

    public void publish(AuditLog auditLog) {
        AuditLog saved = auditLogRepository.save(auditLog);
        broadcast(saved);
    }

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L);
        subscribers.add(emitter);
        emitter.onCompletion(() -> subscribers.remove(emitter));
        emitter.onTimeout(() -> subscribers.remove(emitter));
        emitter.onError(e -> subscribers.remove(emitter));
        return emitter;
    }

    private void broadcast(AuditLog auditLog) {
        AuditLogResponse response = toResponse(auditLog);
        subscribers.removeIf(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("audit-event")
                        .data(response));
                return false;
            } catch (IOException e) {
                log.debug("Removing dead SSE subscriber: {}", e.getMessage());
                return true;
            }
        });
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getUser() != null ? log.getUser().getId() : null,
                log.getUser() != null ? log.getUser().getUsername() : null,
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getOldValues(),
                log.getNewValues(),
                log.getIpAddress(),
                log.getUserAgent(),
                log.getCategory(),
                log.getLogLevel(),
                log.getMethod(),
                log.getEndpoint(),
                log.getStatusCode(),
                log.getDurationMs(),
                log.getRequestParams(),
                log.getResponseSummary(),
                log.getCreatedAt()
        );
    }
}
