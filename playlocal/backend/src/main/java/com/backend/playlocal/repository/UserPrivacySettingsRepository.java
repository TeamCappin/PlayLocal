package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.UserPrivacySettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserPrivacySettingsRepository extends JpaRepository<UserPrivacySettings, UUID> {
}
