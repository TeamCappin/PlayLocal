package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.RetentionPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RetentionPolicyRepository extends JpaRepository<RetentionPolicy, Short> {

    Optional<RetentionPolicy> findByTargetName(String targetName);
}