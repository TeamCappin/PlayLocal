package com.backend.playlocal.service;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.FeatureFlagDto;
import com.backend.playlocal.model.entity.GlobalFeatureFlag;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.GlobalFeatureFlagRepository;
import com.backend.playlocal.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FeatureFlagServiceTest {

  private static final String FLAG_KEY = "admin_ads_switch_on";

  @Mock
  private GlobalFeatureFlagRepository globalFeatureFlagRepository;

  @Mock
  private UserRepository userRepository;

  @InjectMocks
  private FeatureFlagService featureFlagService;

  private User admin;

  @BeforeEach
  void setUp() {
    admin = User.builder()
        .userId(UUID.randomUUID())
        .email("admin@example.com")
        .displayName("Admin")
        .slug("admin")
        .build();
  }

  @Test
  void getAdminAdsSwitchCreatesDefaultWhenMissing() {
    GlobalFeatureFlag created = GlobalFeatureFlag.builder()
        .flagKey(FLAG_KEY)
        .isEnabled(true)
        .build();

    when(globalFeatureFlagRepository.findById(FLAG_KEY)).thenReturn(Optional.empty());
    when(globalFeatureFlagRepository.save(any(GlobalFeatureFlag.class))).thenReturn(created);

    FeatureFlagDto.AdsSwitchResponse response = featureFlagService.getAdminAdsSwitch();

    assertThat(response.isAdminAdsSwitchOn()).isTrue();
    verify(globalFeatureFlagRepository).save(any(GlobalFeatureFlag.class));
  }

  @Test
  void updateAdminAdsSwitchStoresUpdatedValueAndActor() {
    GlobalFeatureFlag existing = GlobalFeatureFlag.builder()
        .flagKey(FLAG_KEY)
        .isEnabled(true)
        .build();

    when(userRepository.findActiveById(admin.getUserId())).thenReturn(Optional.of(admin));
    when(globalFeatureFlagRepository.findById(FLAG_KEY)).thenReturn(Optional.of(existing));
    when(globalFeatureFlagRepository.save(any(GlobalFeatureFlag.class))).thenAnswer(inv -> inv.getArgument(0));

    FeatureFlagDto.AdsSwitchResponse response =
        featureFlagService.updateAdminAdsSwitch(admin.getUserId().toString(), false);

    assertThat(response.isAdminAdsSwitchOn()).isFalse();
    assertThat(response.getUpdatedByEmail()).isEqualTo("admin@example.com");
    verify(userRepository).findActiveById(eq(admin.getUserId()));
    verify(globalFeatureFlagRepository).save(eq(existing));
    assertThat(existing.getUpdatedByUser()).isEqualTo(admin);
    assertThat(existing.getIsEnabled()).isFalse();
  }

  @Test
  void updateAdminAdsSwitchUserMissingThrowsNotFound() {
    UUID missingUserId = UUID.randomUUID();
    when(userRepository.findActiveById(missingUserId)).thenReturn(Optional.empty());

    assertThatThrownBy(() ->
        featureFlagService.updateAdminAdsSwitch(missingUserId.toString(), true)
    ).isInstanceOf(ResourceNotFoundException.class);
  }
}