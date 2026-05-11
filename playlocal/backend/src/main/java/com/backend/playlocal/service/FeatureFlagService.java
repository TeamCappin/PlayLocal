package com.backend.playlocal.service;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.FeatureFlagDto;
import com.backend.playlocal.model.entity.GlobalFeatureFlag;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.GlobalFeatureFlagRepository;
import com.backend.playlocal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class FeatureFlagService {

  private static final String ADMIN_ADS_SWITCH_FLAG = "admin_ads_switch_on";

  private final GlobalFeatureFlagRepository globalFeatureFlagRepository;
  private final UserRepository userRepository;

  public FeatureFlagService(
      GlobalFeatureFlagRepository globalFeatureFlagRepository,
      UserRepository userRepository
  ) {
    this.globalFeatureFlagRepository = globalFeatureFlagRepository;
    this.userRepository = userRepository;
  }

  @Transactional(readOnly = true)
  public FeatureFlagDto.AdsSwitchResponse getAdminAdsSwitch() {
    GlobalFeatureFlag flag = globalFeatureFlagRepository.findById(ADMIN_ADS_SWITCH_FLAG)
        .orElseGet(this::createDefaultAdminAdsSwitch);
    return toAdsSwitchResponse(flag);
  }

  @Transactional
  public FeatureFlagDto.AdsSwitchResponse updateAdminAdsSwitch(
      String authenticatedUserId,
      boolean adminAdsSwitchOn
  ) {
    User actor = userRepository.findActiveById(UUID.fromString(authenticatedUserId))
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    GlobalFeatureFlag flag = globalFeatureFlagRepository.findById(ADMIN_ADS_SWITCH_FLAG)
        .orElseGet(this::createDefaultAdminAdsSwitch);
    flag.setIsEnabled(adminAdsSwitchOn);
    flag.setUpdatedByUser(actor);

    GlobalFeatureFlag saved = globalFeatureFlagRepository.save(flag);
    return toAdsSwitchResponse(saved);
  }

  private GlobalFeatureFlag createDefaultAdminAdsSwitch() {
    GlobalFeatureFlag created = GlobalFeatureFlag.builder()
        .flagKey(ADMIN_ADS_SWITCH_FLAG)
        .isEnabled(true)
        .description("Admin runtime ad switch (ON/OFF)")
        .build();
    return globalFeatureFlagRepository.save(created);
  }

  private FeatureFlagDto.AdsSwitchResponse toAdsSwitchResponse(GlobalFeatureFlag flag) {
    return FeatureFlagDto.AdsSwitchResponse.builder()
        .adminAdsSwitchOn(Boolean.TRUE.equals(flag.getIsEnabled()))
        .updatedAt(flag.getUpdatedAt() == null ? null : flag.getUpdatedAt().toString())
        .updatedByEmail(flag.getUpdatedByUser() == null ? null : flag.getUpdatedByUser().getEmail())
        .build();
  }
}