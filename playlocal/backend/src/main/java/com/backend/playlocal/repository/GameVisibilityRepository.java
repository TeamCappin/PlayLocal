package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.GameVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GameVisibilityRepository extends JpaRepository<GameVisibility, UUID> {
    Optional<GameVisibility> findByCode(String code);
}
