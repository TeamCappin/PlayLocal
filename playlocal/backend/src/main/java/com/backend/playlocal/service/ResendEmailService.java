package com.backend.playlocal.service;

import com.backend.playlocal.config.ResendConfig;
import com.backend.playlocal.model.entity.EmailLog;
import com.backend.playlocal.repository.EmailLogRepository;
import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ResendEmailService implements EmailService {

  private static final Logger log =
      LoggerFactory.getLogger(ResendEmailService.class);

  private final Resend resend;
  private final ResendConfig config;
  private final EmailLogRepository emailLogRepository;

  public ResendEmailService(Resend resend,
                            ResendConfig config,
                            EmailLogRepository emailLogRepository) {
    this.resend = resend;
    this.config = config;
    this.emailLogRepository = emailLogRepository;
  }

  @Override
  public boolean sendEmail(String to, String subject,
                           String content, String footer) {
    if (!config.isEnabled()) {
      log.info("Email sending disabled. Skipping email to {}", to);
      return false;
    }

    String htmlBody = buildHtml(content, footer);
    String from = config.getFromName() + " <" + config.getFromEmail() + ">";

    EmailLog emailLog = EmailLog.builder()
        .recipientEmail(to)
        .subject(subject)
        .emailType("GENERIC")
        .status(EmailLog.EmailStatus.PENDING)
        .build();

    try {
      CreateEmailOptions options = CreateEmailOptions.builder()
          .from(from)
          .to(to)
          .subject(subject)
          .html(htmlBody)
          .build();

      CreateEmailResponse response = resend.emails().send(options);

      emailLog.setResendId(response.getId());
      emailLog.setStatus(EmailLog.EmailStatus.SENT);
      emailLogRepository.save(emailLog);

      log.info("Email sent to {} [resendId={}]", to, response.getId());
      return true;

    } catch (ResendException e) {
      emailLog.setStatus(EmailLog.EmailStatus.FAILED);
      emailLog.setErrorMessage(e.getMessage());
      emailLogRepository.save(emailLog);

      log.error("Failed to send email to {}: {}", to, e.getMessage());
      return false;
    }
  }

  @Override
  public boolean sendPasswordResetEmail(String to, String code) {
    String subject = "PlayLocal - Password Reset Code";
    String content = "<h2>Password Reset</h2>"
        + "<p>Your password reset code is:</p>"
        + "<div style=\"font-size:32px;font-weight:bold;"
        + "letter-spacing:8px;text-align:center;"
        + "padding:16px;background:#f0fdf4;"
        + "border-radius:8px;margin:16px 0;\">"
        + code + "</div>"
        + "<p>This code expires in <strong>10 minutes</strong>.</p>"
        + "<p>If you did not request this, please ignore this email.</p>";
    String footer = "You received this because a password reset"
        + " was requested for your PlayLocal account.";

    return sendTypedEmail(to, subject, content, footer, "PASSWORD_RESET");
  }

  @Override
  public boolean sendSignupVerificationEmail(String to, String code) {
    String subject = "PlayLocal - Verify Your Email";
    String content = "<h2>Welcome to PlayLocal!</h2>"
        + "<p>Your verification code is:</p>"
        + "<div style=\"font-size:32px;font-weight:bold;"
        + "letter-spacing:8px;text-align:center;"
        + "padding:16px;background:#f0fdf4;"
        + "border-radius:8px;margin:16px 0;\">"
        + code + "</div>"
        + "<p>This code expires in <strong>10 minutes</strong>.</p>";
    String footer = "You received this because an account"
        + " was created with this email on PlayLocal.";

    return sendTypedEmail(to, subject, content, footer,
        "SIGNUP_VERIFICATION");
  }

  @Override
  public boolean sendMfaCodeEmail(String to, String code) {
    String subject = "PlayLocal - Login Verification Code";
    String content = "<h2>Login Verification</h2>"
        + "<p>Your verification code is:</p>"
        + "<div style=\"font-size:32px;font-weight:bold;"
        + "letter-spacing:8px;text-align:center;"
        + "padding:16px;background:#f0fdf4;"
        + "border-radius:8px;margin:16px 0;\">"
        + code + "</div>"
        + "<p>This code expires in <strong>5 minutes</strong>.</p>"
        + "<p>If you did not attempt to log in,"
        + " please secure your account immediately.</p>";
    String footer = "You received this because a login attempt"
        + " was made on your PlayLocal account.";

    return sendTypedEmail(to, subject, content, footer, "MFA_CODE");
  }

  private boolean sendTypedEmail(String to, String subject,
                                 String content, String footer,
                                 String emailType) {
    if (!config.isEnabled()) {
      log.info("Email sending disabled. Skipping {} email to {}",
          emailType, to);
      return false;
    }

    String htmlBody = buildHtml(content, footer);
    String from = config.getFromName() + " <" + config.getFromEmail() + ">";

    EmailLog emailLog = EmailLog.builder()
        .recipientEmail(to)
        .subject(subject)
        .emailType(emailType)
        .status(EmailLog.EmailStatus.PENDING)
        .build();

    try {
      CreateEmailOptions options = CreateEmailOptions.builder()
          .from(from)
          .to(to)
          .subject(subject)
          .html(htmlBody)
          .build();

      CreateEmailResponse response = resend.emails().send(options);

      emailLog.setResendId(response.getId());
      emailLog.setStatus(EmailLog.EmailStatus.SENT);
      emailLogRepository.save(emailLog);

      log.info("{} email sent to {} [resendId={}]",
          emailType, to, response.getId());
      return true;

    } catch (ResendException e) {
      emailLog.setStatus(EmailLog.EmailStatus.FAILED);
      emailLog.setErrorMessage(e.getMessage());
      emailLogRepository.save(emailLog);

      log.error("Failed to send {} email to {}: {}",
          emailType, to, e.getMessage());
      return false;
    }
  }

  private String buildHtml(String content, String footer) {
    StringBuilder sb = new StringBuilder();
    sb.append("<!DOCTYPE html><html><head>"
        + "<meta charset=\"UTF-8\"></head><body "
        + "style=\"font-family:sans-serif;margin:0;padding:0;"
        + "background:#f9fafb;\">");
    sb.append("<div style=\"max-width:600px;margin:40px auto;"
        + "background:#ffffff;border-radius:12px;"
        + "border:1px solid #e5e7eb;overflow:hidden;\">");

    // Header
    sb.append("<div style=\"background:#059669;padding:24px;"
        + "text-align:center;\">");
    sb.append("<h1 style=\"color:#ffffff;margin:0;"
        + "font-size:24px;\">PlayLocal</h1>");
    sb.append("</div>");

    // Content
    sb.append("<div style=\"padding:32px;color:#1f2937;\">");
    sb.append(content);
    sb.append("</div>");

    // Footer
    if (footer != null && !footer.isBlank()) {
      sb.append("<div style=\"padding:16px 32px;"
          + "background:#f9fafb;border-top:1px solid #e5e7eb;"
          + "color:#6b7280;font-size:12px;text-align:center;\">");
      sb.append(footer);
      sb.append("</div>");
    }

    sb.append("</div></body></html>");
    return sb.toString();
  }
}
