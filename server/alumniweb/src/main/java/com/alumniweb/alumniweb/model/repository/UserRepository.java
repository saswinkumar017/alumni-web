package com.alumniweb.alumniweb.model.repository;

import com.alumniweb.alumniweb.model.MasterAlumni;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.enums.AccountStatus;
import com.alumniweb.alumniweb.model.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByMasterAlumni(MasterAlumni masterAlumni);

    boolean existsByUsername(String username);

    List<User> findByRole(UserRole role);

    Page<User> findByRole(UserRole role, Pageable pageable);

    List<User> findByAccountStatus(AccountStatus accountStatus);

    Page<User> findByAccountStatus(AccountStatus accountStatus, Pageable pageable);

    Page<User> findByUsernameContaining(String username, Pageable pageable);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.masterAlumni WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<User> searchByQuery(@Param("query") String query, Pageable pageable);
}
