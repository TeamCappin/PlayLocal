package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.GlobalFeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GlobalFeatureFlagRepository extends JpaRepository<GlobalFeatureFlag, String> {
}