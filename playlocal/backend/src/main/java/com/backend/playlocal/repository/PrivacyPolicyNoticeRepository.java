package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.PrivacyPolicyNotice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PrivacyPolicyNoticeRepository extends JpaRepository<PrivacyPolicyNotice, Short> {
}