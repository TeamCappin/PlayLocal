package com.backend.playlocal.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "mail")
@Getter
@Setter
public class MailConfig {

  private String fromEmail;
  private String fromName = "PlayLocal";
  private boolean enabled = true;
}
