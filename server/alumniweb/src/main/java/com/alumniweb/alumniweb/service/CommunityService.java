package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.community.CommunityMessageResponse;
import com.alumniweb.alumniweb.dto.community.CreateCommunityRequest;
import com.alumniweb.alumniweb.model.*;
import com.alumniweb.alumniweb.model.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class CommunityService {
    private final CommunityRepository communityRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final AlumniMessageRepository messageRepository;
    private final UserRepository userRepository;

    public List<Community> listCommunities(String batch, String department, Long userId) {
        List<Community> communities;
        if (batch != null && !batch.isBlank()) communities = communityRepository.findByBatchAndDeletedFalse(batch);
        else if (department != null && !department.isBlank()) communities = communityRepository.findByDepartmentAndDeletedFalse(department);
        else communities = communityRepository.findByDeletedFalse();
        for (Community community : communities) {
            community.setIsMember(communityMemberRepository.existsByCommunityIdAndUserId(community.getId(), userId));
        }
        return communities;
    }

    public Community getCommunity(Long id) {
        return communityRepository.findById(id).orElseThrow(() -> new RuntimeException("Community not found"));
    }

    public Community getCommunity(Long id, Long userId) {
        Community community = getCommunity(id);
        community.setIsMember(communityMemberRepository.existsByCommunityIdAndUserId(community.getId(), userId));
        return community;
    }

    @Transactional
    public Community createCommunity(CreateCommunityRequest request, Long userId) {
        if (request.name() == null || request.name().isBlank()) {
            throw new RuntimeException("Community name is required");
        }
        Community community = Community.builder()
                .name(request.name())
                .description(request.description())
                .batch(request.batch())
                .department(request.department())
                .isPublic(request.isPublic() == null ? true : request.isPublic())
                .createdBy(userId)
                .memberCount(1)
                .build();
        community = communityRepository.save(community);

        CommunityMember member = CommunityMember.builder()
                .community(community)
                .userId(userId)
                .role("ADMIN")
                .build();
        communityMemberRepository.save(member);
        community.setIsMember(true);
        return community;
    }

    @Transactional
    public CommunityMember joinCommunity(Long communityId, Long userId) {
        Community community = getCommunity(communityId);
        if (communityMemberRepository.existsByCommunityIdAndUserId(communityId, userId))
            throw new RuntimeException("Already a member");
        CommunityMember member = CommunityMember.builder().community(community).userId(userId).build();
        community.setMemberCount(community.getMemberCount() + 1);
        communityRepository.save(community);
        return communityMemberRepository.save(member);
    }

    @Transactional
    public void leaveCommunity(Long communityId, Long userId) {
        CommunityMember member = communityMemberRepository.findByCommunityIdAndUserId(communityId, userId)
                .orElseThrow(() -> new RuntimeException("Not a member"));
        Community community = getCommunity(communityId);
        community.setMemberCount(Math.max(0, community.getMemberCount() - 1));
        communityRepository.save(community);
        communityMemberRepository.delete(member);
    }

    public List<CommunityMember> getMembers(Long communityId, Long userId) {
        requireReadAccess(communityId, userId);
        return communityMemberRepository.findByCommunityId(communityId);
    }

    public List<CommunityMessageResponse> getCommunityMessages(Long communityId, Long userId) {
        requireReadAccess(communityId, userId);
        return messageRepository.findByCommunityIdOrderByCreatedAtAsc(communityId).stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @Transactional
    public CommunityMessageResponse postCommunityMessage(Long communityId, Long userId, String body) {
        if (body == null || body.isBlank()) throw new RuntimeException("Message body is required");
        requireMember(communityId, userId);
        AlumniMessage msg = AlumniMessage.builder()
                .senderId(userId).communityId(communityId).body(body).messageType("COMMUNITY").build();
        return toMessageResponse(messageRepository.save(msg));
    }

    private void requireReadAccess(Long communityId, Long userId) {
        Community community = getCommunity(communityId);
        if (Boolean.TRUE.equals(community.getIsPublic())) return;
        requireMember(communityId, userId);
    }

    private void requireMember(Long communityId, Long userId) {
        if (!communityMemberRepository.existsByCommunityIdAndUserId(communityId, userId)) {
            throw new RuntimeException("Not a member");
        }
    }

    private CommunityMessageResponse toMessageResponse(AlumniMessage message) {
        String senderName = null;
        String senderAvatar = null;
        if (message.getSenderId() != null) {
            User sender = userRepository.findById(message.getSenderId()).orElse(null);
            if (sender != null) {
                senderName = sender.getMasterAlumni() != null && sender.getMasterAlumni().getName() != null
                        ? sender.getMasterAlumni().getName()
                        : sender.getUsername();
            }
        }
        return new CommunityMessageResponse(
                message.getId(),
                message.getCommunityId(),
                message.getSenderId(),
                senderName,
                senderAvatar,
                message.getBody(),
                message.getCreatedAt()
        );
    }
}
