package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.AlumniMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlumniMessageRepository extends JpaRepository<AlumniMessage, Long> {
    List<AlumniMessage> findBySenderIdOrReceiverId(Long id1, Long id2);
    long countByReceiverIdAndIsReadFalse(Long receiverId);
    List<AlumniMessage> findByCommunityIdOrderByCreatedAtAsc(Long communityId);
    List<AlumniMessage> findByReceiverIdAndIsReadFalse(Long receiverId);
    List<AlumniMessage> findByReceiverIdAndMessageType(Long receiverId, String messageType);
}
