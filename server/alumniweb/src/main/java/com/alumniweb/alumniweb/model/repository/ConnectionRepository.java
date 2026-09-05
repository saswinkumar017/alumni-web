package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Long> {
    List<Connection> findByRequesterIdOrRecipientId(Long id1, Long id2);
    Optional<Connection> findByRequesterIdAndRecipientId(Long requesterId, Long recipientId);
    List<Connection> findByStatus(String status);
    List<Connection> findByRecipientIdAndStatus(Long recipientId, String status);
    List<Connection> findByRequesterIdAndStatus(Long requesterId, String status);
}
