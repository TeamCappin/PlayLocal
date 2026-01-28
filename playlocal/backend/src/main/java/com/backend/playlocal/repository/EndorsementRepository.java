package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.Endorsement;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EndorsementRepository extends JpaRepository<Endorsement, UUID> {

    boolean existsByEndorserAndEndorsedUserAndGame(User endorser, User endorsedUser, Game game);

    List<Endorsement> findByGameAndEndorser(Game game, User endorser);

    List<Endorsement> findByEndorsedUser_UserIdOrderByCreatedAtDesc(UUID endorsedUserId);
    
    // For limiting results (e.g. top 5), we can use Pageable or custom queries
    List<Endorsement> findByEndorsedUser_UserId(UUID endorsedUserId, Pageable pageable);
    
    long countByEndorsedUser_UserId(UUID endorsedUserId);

    @Query("SELECT e.endorsedUser.userId, COUNT(e) FROM Endorsement e WHERE e.endorsedUser.userId IN :userIds GROUP BY e.endorsedUser.userId")
    List<Object[]> countEndorsementsByUserIds(@Param("userIds") List<UUID> userIds);
}
