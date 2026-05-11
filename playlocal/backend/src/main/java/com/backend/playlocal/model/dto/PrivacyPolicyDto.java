package com.backend.playlocal.model.dto;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class PrivacyPolicyDto {

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class StatusResponse {
    private String lastUpdated;
    private String effectiveDate;
    private String updatedByEmail;
    private boolean bannerVisible;
    private String notice;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UpdateRequest {
    @Email(message = "Invalid email format")
    private String triggeredByEmail;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UpdateResponse {
    private String lastUpdated;
    private String effectiveDate;
    private String updatedByEmail;
    private boolean bannerVisible;
    private String notice;
    private int recipientsTargeted;
    private int emailsSent;
    private int emailsFailed;
  }
}