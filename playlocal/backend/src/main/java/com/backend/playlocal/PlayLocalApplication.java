package com.backend.playlocal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PlayLocalApplication {

    public static void main(String[] args) {
        SpringApplication.run(PlayLocalApplication.class, args);
    }

}
