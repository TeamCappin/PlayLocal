package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.ContentVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContentVisibilityRepository extends JpaRepository<ContentVisibility, UUID> {
    Optional<ContentVisibility> findByCode(String code);
}
