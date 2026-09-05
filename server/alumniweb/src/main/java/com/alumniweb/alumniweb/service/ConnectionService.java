package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.connection.ConnectionResponse;
import com.alumniweb.alumniweb.dto.connection.ConnectionSuggestionResponse;
import com.alumniweb.alumniweb.exception.AlumniNotFoundException;
import com.alumniweb.alumniweb.model.Connection;
import com.alumniweb.alumniweb.model.MasterAlumni;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.repository.ConnectionRepository;
import com.alumniweb.alumniweb.model.repository.MasterAlumniRepository;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class ConnectionService {
    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final MasterAlumniRepository masterAlumniRepository;

    public List<ConnectionResponse> getConnections(Long userId) {
        return connectionRepository.findByRequesterIdOrRecipientId(userId, userId).stream()
                .filter(c -> "ACCEPTED".equals(c.getStatus()))
                .map(c -> resolve(c, userId)).toList();
    }

    public List<ConnectionResponse> getPendingRequests(Long userId) {
        return connectionRepository.findByRecipientIdAndStatus(userId, "PENDING").stream()
                .map(c -> resolve(c, userId)).toList();
    }

    public List<ConnectionResponse> getSentRequests(Long userId) {
        return connectionRepository.findByRequesterIdAndStatus(userId, "PENDING").stream()
                .map(c -> resolve(c, userId)).toList();
    }

    public List<ConnectionSuggestionResponse> getSuggestions(Long userId, String batch) {
        String targetBatch = batch;
        if (targetBatch == null || targetBatch.isBlank()) {
            User currentUser = userRepository.findById(userId).orElse(null);
            if (currentUser != null && currentUser.getMasterAlumni() != null) {
                targetBatch = currentUser.getMasterAlumni().getBatch();
            }
        }
        if (targetBatch == null || targetBatch.isBlank()) {
            return List.of();
        }

        String finalBatch = targetBatch;
        return masterAlumniRepository.findByBatch(finalBatch).stream()
                .map(MasterAlumni::getUser)
                .filter(u -> u != null)
                .filter(u -> !u.getId().equals(userId))
                .map(u -> toSuggestion(u, userId))
                .toList();
    }

    private ConnectionSuggestionResponse toSuggestion(User alumniUser, Long userId) {
        MasterAlumni m = alumniUser.getMasterAlumni();
        return new ConnectionSuggestionResponse(
                alumniUser.getId(),
                m == null ? null : m.getRegisterNumber(),
                m == null ? alumniUser.getUsername() : m.getName(),
                m == null ? null : m.getDepartment(),
                m == null ? null : m.getBatch(),
                m == null ? null : m.getYearOfPassing(),
                m == null ? null : m.getCompany(),
                m == null ? null : m.getDesignation(),
                computeConnectionStatus(userId, alumniUser.getId())
        );
    }

    private String computeConnectionStatus(Long userId, Long candidateId) {
        Optional<Connection> outbound = connectionRepository.findByRequesterIdAndRecipientId(userId, candidateId);
        if (outbound.isPresent()) {
            if ("ACCEPTED".equals(outbound.get().getStatus())) return "CONNECTED";
            if ("PENDING".equals(outbound.get().getStatus())) return "PENDING_SENT";
            return "NONE";
        }
        Optional<Connection> inbound = connectionRepository.findByRequesterIdAndRecipientId(candidateId, userId);
        if (inbound.isPresent()) {
            if ("ACCEPTED".equals(inbound.get().getStatus())) return "CONNECTED";
            if ("PENDING".equals(inbound.get().getStatus())) return "PENDING_RECEIVED";
            return "NONE";
        }
        return "NONE";
    }

    @Transactional
    public Connection sendConnectionRequest(Long requesterId, Long recipientId, String message) {
        if (requesterId.equals(recipientId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot connect with yourself");
        }
        connectionRepository.findByRequesterIdAndRecipientId(requesterId, recipientId)
                .ifPresent(c -> { throw new ResponseStatusException(HttpStatus.CONFLICT, "Request already exists"); });
        Connection conn = Connection.builder()
                .requesterId(requesterId).recipientId(recipientId).message(message).build();
        return connectionRepository.save(conn);
    }

    @Transactional
    public Connection sendConnectionRequestByRegister(Long requesterId, String registerNumber, String message) {
        MasterAlumni target = masterAlumniRepository.findByRegisterNumber(registerNumber)
                .orElseThrow(() -> new AlumniNotFoundException(registerNumber));
        User recipient = target.getUser();
        if (recipient == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This alumni has not registered on the portal yet");
        }
        return sendConnectionRequest(requesterId, recipient.getId(), message);
    }

    @Transactional
    public void acceptConnection(Long id, Long userId) {
        Connection conn = connectionRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        if (!conn.getRecipientId().equals(userId)) throw new RuntimeException("Not authorized");
        conn.setStatus("ACCEPTED");
        conn.setRespondedAt(LocalDateTime.now());
        connectionRepository.save(conn);
    }

    @Transactional
    public void rejectConnection(Long id, Long userId) {
        Connection conn = connectionRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        if (!conn.getRecipientId().equals(userId)) throw new RuntimeException("Not authorized");
        conn.setStatus("REJECTED");
        conn.setRespondedAt(LocalDateTime.now());
        connectionRepository.save(conn);
    }

    @Transactional
    public void removeConnection(Long id, Long userId) {
        Connection conn = connectionRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        if (!conn.getRequesterId().equals(userId) && !conn.getRecipientId().equals(userId))
            throw new RuntimeException("Not authorized");
        connectionRepository.delete(conn);
    }

    private ConnectionResponse resolve(Connection conn, Long currentUserId) {
        return ConnectionResponse.from(
            conn,
            getName(conn.getRequesterId()), getRegisterNumber(conn.getRequesterId()),
            getName(conn.getRecipientId()), getRegisterNumber(conn.getRecipientId())
        );
    }

    private String getName(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return "Unknown";
        if (user.getMasterAlumni() != null) return user.getMasterAlumni().getName();
        return user.getUsername();
    }

    private String getRegisterNumber(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getMasterAlumni() == null) return null;
        return user.getMasterAlumni().getRegisterNumber();
    }
}
