package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.EmailDto;
import com.backend.playlocal.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({ "/api/v1/email", "/api/v2/email" })
public class EmailController {

  private final EmailService emailService;

  public EmailController(EmailService emailService) {
    this.emailService = emailService;
  }

  /**
   * Send a generic transactional email.
   * Intended for testing via Postman.
   */
  @PostMapping("/send")
  public ResponseEntity<EmailDto.SendResponse> sendEmail(
      @Valid @RequestBody EmailDto.SendRequest request) {
    boolean success = emailService.sendEmail(
        request.getTo(),
        request.getSubject(),
        request.getContent(),
        request.getFooter()
    );

    EmailDto.SendResponse response = EmailDto.SendResponse.builder()
        .success(success)
        .message(success ? "Email sent successfully"
            : "Failed to send email")
        .build();

    return success
        ? ResponseEntity.ok(response)
        : ResponseEntity.internalServerError().body(response);
  }

  /**
   * Test password reset email.
   */
  @PostMapping("/test/password-reset")
  public ResponseEntity<EmailDto.SendResponse> testPasswordReset(
      @Valid @RequestBody EmailDto.SendRequest request) {
    boolean success = emailService.sendPasswordResetEmail(
        request.getTo(), "123456");

    return buildResponse(success);
  }

  /**
   * Test signup verification email.
   */
  @PostMapping("/test/signup-verification")
  public ResponseEntity<EmailDto.SendResponse> testSignupVerification(
      @Valid @RequestBody EmailDto.SendRequest request) {
    boolean success = emailService.sendSignupVerificationEmail(
        request.getTo(), "654321");

    return buildResponse(success);
  }

  /**
   * Test MFA code email.
   */
  @PostMapping("/test/mfa-code")
  public ResponseEntity<EmailDto.SendResponse> testMfaCode(
      @Valid @RequestBody EmailDto.SendRequest request) {
    boolean success = emailService.sendMfaCodeEmail(
        request.getTo(), "789012");

    return buildResponse(success);
  }

  private ResponseEntity<EmailDto.SendResponse> buildResponse(
      boolean success) {
    EmailDto.SendResponse response = EmailDto.SendResponse.builder()
        .success(success)
        .message(success ? "Test email sent successfully"
            : "Failed to send test email")
        .build();

    return success
        ? ResponseEntity.ok(response)
        : ResponseEntity.internalServerError().body(response);
  }
}
