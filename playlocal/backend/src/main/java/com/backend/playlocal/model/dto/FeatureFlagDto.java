package com.backend.playlocal.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class FeatureFlagDto {

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class AdsSwitchResponse {
    private boolean adminAdsSwitchOn;
    private String updatedAt;
    private String updatedByEmail;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UpdateAdsSwitchRequest {
    @NotNull
    private Boolean adminAdsSwitchOn;
  }
}