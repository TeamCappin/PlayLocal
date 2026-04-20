package com.backend.playlocal.service;

/**
 * Abstraction for sending transactional emails.
 * Authentication flows call these methods without knowing the provider.
 */
public interface EmailService {

  /**
   * Send a transactional email.
   *
   * @param to      recipient email address
   * @param subject email subject line
   * @param content email body (HTML supported)
   * @param footer  optional footer text (nullable)
   * @return true if sent successfully
   */
  boolean sendEmail(String to, String subject, String content, String footer);

  /**
   * Send a password reset code email.
   */
  boolean sendPasswordResetEmail(String to, String code);

  /**
   * Send a signup verification email.
   */
  boolean sendSignupVerificationEmail(String to, String code);

  /**
   * Send an MFA verification code email.
   */
  boolean sendMfaCodeEmail(String to, String code);

  /**
   * Send a welcome email after successful registration.
   */
  boolean sendWelcomeEmail(String to, String displayName);

  /**
   * Send a privacy policy update notice email.
   *
   * Default implementation keeps compatibility for any alternate providers
   * by routing through the generic transactional email method.
   */
boolean sendPrivacyPolicyUpdateEmail(String to,
                           String effectiveDate,
                                               String notice);
}
