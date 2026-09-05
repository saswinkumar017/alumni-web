package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.CommunityMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommunityMemberRepository extends JpaRepository<CommunityMember, Long> {

    List<CommunityMember> findByCommunityId(Long communityId);

    Optional<CommunityMember> findByCommunityIdAndUserId(Long communityId, Long userId);

    List<CommunityMember> findByUserId(Long userId);

    boolean existsByCommunityIdAndUserId(Long communityId, Long userId);
}
