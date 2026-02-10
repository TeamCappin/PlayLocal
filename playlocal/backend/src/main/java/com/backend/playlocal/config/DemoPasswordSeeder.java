package com.backend.playlocal.config;

import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Ensures demo users (@demo.com) have a password hash that matches "password123"
 * using the application's PasswordEncoder. Fixes login when the seed migration
 * (V9) uses a hash that does not match (e.g. different BCrypt implementation).
 * Only runs when not using the production profile.
 */
@Component
@Profile("!prod")
public class DemoPasswordSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoPasswordSeeder.class);
    private static final String DEMO_PASSWORD = "password123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoPasswordSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<User> demoUsers = userRepository.findDemoUsers();
        if (demoUsers.isEmpty()) {
            return;
        }
        String encoded = passwordEncoder.encode(DEMO_PASSWORD);
        for (User u : demoUsers) {
            if (!passwordEncoder.matches(DEMO_PASSWORD, u.getPasswordHash())) {
                u.setPasswordHash(encoded);
                userRepository.save(u);
                log.debug("Updated demo user password for: {}", u.getEmail());
            }
        }
    }
}
