package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.FeatureFlagDto;
import com.backend.playlocal.service.FeatureFlagService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({ "/api/v1/feature-flags", "/api/v2/feature-flags" })
public class FeatureFlagController {

  private final FeatureFlagService featureFlagService;

  public FeatureFlagController(FeatureFlagService featureFlagService) {
    this.featureFlagService = featureFlagService;
  }

  @GetMapping("/ads-switch")
  public ResponseEntity<FeatureFlagDto.AdsSwitchResponse> getAdsSwitch() {
    return ResponseEntity.ok(featureFlagService.getAdminAdsSwitch());
  }

  @PutMapping("/ads-switch")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<FeatureFlagDto.AdsSwitchResponse> updateAdsSwitch(
      Authentication authentication,
      @Valid @RequestBody FeatureFlagDto.UpdateAdsSwitchRequest request
  ) {
    FeatureFlagDto.AdsSwitchResponse response = featureFlagService.updateAdminAdsSwitch(
        authentication.getName(),
        Boolean.TRUE.equals(request.getAdminAdsSwitchOn())
    );
    return ResponseEntity.ok(response);
  }
}