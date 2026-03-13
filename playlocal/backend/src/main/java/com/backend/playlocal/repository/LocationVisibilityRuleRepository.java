package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.LocationVisibilityRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LocationVisibilityRuleRepository extends JpaRepository<LocationVisibilityRule, UUID> {
    Optional<LocationVisibilityRule> findByCode(String code);
}
