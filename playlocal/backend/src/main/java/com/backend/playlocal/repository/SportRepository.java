package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.Sport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SportRepository extends JpaRepository<Sport, UUID> {
    Optional<Sport> findByNameIgnoreCase(String name);
}
