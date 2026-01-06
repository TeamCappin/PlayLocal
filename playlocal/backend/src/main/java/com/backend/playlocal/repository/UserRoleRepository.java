package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {

    @Query("SELECT ur FROM UserRole ur WHERE ur.user.userId = :userId AND ur.revokedAt IS NULL")
    List<UserRole> findActiveRolesByUserId(UUID userId);

    @Query("SELECT ur.role.name FROM UserRole ur WHERE ur.user.userId = :userId AND ur.revokedAt IS NULL")
    List<String> findRoleNamesByUserId(UUID userId);
}
