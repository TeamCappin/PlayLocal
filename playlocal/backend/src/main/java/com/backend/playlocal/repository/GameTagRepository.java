package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.GameTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GameTagRepository extends JpaRepository<GameTag, UUID> {
    Optional<GameTag> findByName(String name);
    List<GameTag> findAllByIsSystemTagTrue();
    List<GameTag> findAllByIsRestrictedTrue();
}
