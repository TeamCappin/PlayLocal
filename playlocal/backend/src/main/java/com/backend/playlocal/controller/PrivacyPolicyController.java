package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.PrivacyPolicyDto;
import com.backend.playlocal.service.PrivacyPolicyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({ "/api/v1/privacy-policy", "/api/v2/privacy-policy" })
public class PrivacyPolicyController {

  private final PrivacyPolicyService privacyPolicyService;

  public PrivacyPolicyController(PrivacyPolicyService privacyPolicyService) {
    this.privacyPolicyService = privacyPolicyService;
  }

  @GetMapping("/status")
  public ResponseEntity<PrivacyPolicyDto.StatusResponse> getStatus() {
    return ResponseEntity.ok(privacyPolicyService.getStatus());
  }

  @PostMapping("/update")
  public ResponseEntity<PrivacyPolicyDto.UpdateResponse> updatePolicy(
      Authentication authentication,
      @Valid @RequestBody(required = false) PrivacyPolicyDto.UpdateRequest request) {
    String userId = authentication.getName();
    String triggeredByEmail = request == null ? null : request.getTriggeredByEmail();
    PrivacyPolicyDto.UpdateResponse response = privacyPolicyService.triggerUpdate(userId, triggeredByEmail);
    return ResponseEntity.ok(response);
  }
}