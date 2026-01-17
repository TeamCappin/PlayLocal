package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.Endorsement;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EndorsementRepository extends JpaRepository<Endorsement, UUID> {

    boolean existsByEndorserAndEndorsedUserAndGame(User endorser, User endorsedUser, Game game);

    List<Endorsement> findByEndorsedUser_UserIdOrderByCreatedAtDesc(UUID endorsedUserId);
    
    // For limiting results (e.g. top 5), we can use Pageable or custom queries
    List<Endorsement> findByEndorsedUser_UserId(UUID endorsedUserId, Pageable pageable);
    
    long countByEndorsedUser_UserId(UUID endorsedUserId);
}
