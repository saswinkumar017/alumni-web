package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.message.ConversationResponse;
import com.alumniweb.alumniweb.model.AlumniMessage;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.repository.AlumniMessageRepository;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class AlumniMessageService {
    private final AlumniMessageRepository messageRepository;
    private final UserRepository userRepository;

    public List<AlumniMessage> getConversations(Long userId) {
        return messageRepository.findBySenderIdOrReceiverId(userId, userId).stream()
                .filter(m -> !m.isDeleted() && m.getCommunityId() == null && "DIRECT".equals(m.getMessageType()))
                .toList();
    }

    public List<ConversationResponse> getConversationSummaries(Long userId) {
        Map<Long, List<AlumniMessage>> byCounterpart = new LinkedHashMap<>();
        for (AlumniMessage message : getConversations(userId)) {
            Long counterpart = resolveCounterpart(message, userId);
            if (counterpart == null) continue;
            byCounterpart.computeIfAbsent(counterpart, k -> new ArrayList<>()).add(message);
        }

        List<ConversationResponse> summaries = new ArrayList<>();
        for (Map.Entry<Long, List<AlumniMessage>> entry : byCounterpart.entrySet()) {
            Long counterpartId = entry.getKey();
            List<AlumniMessage> messages = entry.getValue().stream()
                    .sorted(Comparator.comparing(AlumniMessage::getCreatedAt,
                            Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();
            AlumniMessage latest = messages.get(0);
            long unread = messages.stream()
                    .filter(m -> userId.equals(m.getReceiverId()) && !Boolean.TRUE.equals(m.getIsRead()))
                    .count();
            User user = userRepository.findById(counterpartId).orElse(null);
            String name = user == null ? "Unknown" : user.getUsername();
            String registerNumber = null;
            if (user != null && user.getMasterAlumni() != null) {
                name = user.getMasterAlumni().getName();
                registerNumber = user.getMasterAlumni().getRegisterNumber();
            }
            summaries.add(new ConversationResponse(
                    counterpartId, name, registerNumber,
                    latest.getBody(), latest.getCreatedAt(), unread));
        }
        summaries.sort(Comparator.comparing(ConversationResponse::lastMessageAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return summaries;
    }

    public List<AlumniMessage> getThread(Long userId, Long counterpartId) {
        return getConversations(userId).stream()
                .filter(m -> userId.equals(m.getSenderId()) ? counterpartId.equals(m.getReceiverId())
                        : counterpartId.equals(m.getSenderId()))
                .sorted(Comparator.comparing(AlumniMessage::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    private Long resolveCounterpart(AlumniMessage message, Long userId) {
        if (userId.equals(message.getSenderId())) return message.getReceiverId();
        if (userId.equals(message.getReceiverId())) return message.getSenderId();
        return null;
    }

    public AlumniMessage getMessage(Long id) {
        return messageRepository.findById(id).orElseThrow(() -> new RuntimeException("Message not found"));
    }

    public AlumniMessage getMessageForUser(Long id, Long userId) {
        AlumniMessage message = getMessage(id);
        boolean isParticipant = (message.getSenderId() != null && message.getSenderId().equals(userId))
                || (message.getReceiverId() != null && message.getReceiverId().equals(userId));
        if (!isParticipant) {
            throw new RuntimeException("Not authorized");
        }
        return message;
    }

    @Transactional
    public AlumniMessage sendMessage(Long senderId, Long receiverId, String subject, String body) {
        AlumniMessage msg = AlumniMessage.builder()
                .senderId(senderId).receiverId(receiverId).subject(subject).body(body).messageType("DIRECT").build();
        return messageRepository.save(msg);
    }

    @Transactional
    public void markAsRead(Long id, Long userId) {
        AlumniMessage msg = getMessage(id);
        if (msg.getReceiverId() != null && msg.getReceiverId().equals(userId)) {
            msg.setIsRead(true);
            messageRepository.save(msg);
        }
    }

    @Transactional
    public void deleteMessage(Long id, Long userId) {
        AlumniMessage msg = getMessage(id);
        if (msg.getSenderId().equals(userId) || (msg.getReceiverId() != null && msg.getReceiverId().equals(userId))) {
            msg.setDeleted(true);
            messageRepository.save(msg);
        }
    }

    public long getUnreadCount(Long userId) {
        return messageRepository.countByReceiverIdAndIsReadFalse(userId);
    }

    public List<AlumniMessage> getBroadcasts(Long userId) {
        return messageRepository.findByReceiverIdAndMessageType(userId, "BROADCAST");
    }
}
