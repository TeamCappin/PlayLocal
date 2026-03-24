package com.backend.playlocal.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
public class S3Config {

    /**
     * For MinIO/local: set endpoint (e.g. http://localhost:9000) and forcePathStyle=true
     * For AWS S3/prod: leave endpoint empty (or omit) and forcePathStyle=false
     */
    @Value("${s3.endpoint:}")
    private String endpoint;

    @Value("${s3.region:us-east-1}")
    private String region;

    @Value("${s3.accessKey}")
    private String accessKey;

    @Value("${s3.secretKey}")
    private String secretKey;

    @Value("${s3.forcePathStyle:false}")
    private boolean forcePathStyle;

    @Bean
    public S3Client s3Client() {
        AwsBasicCredentials creds = AwsBasicCredentials.create(accessKey, secretKey);

        software.amazon.awssdk.services.s3.S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(creds))
                .serviceConfiguration(
                        S3Configuration.builder()
                                .pathStyleAccessEnabled(forcePathStyle)
                                .build()
                );

        // Only override endpoint when using MinIO / non-AWS S3
        if (endpoint != null && !endpoint.isBlank()) {
            builder = builder.endpointOverride(URI.create(endpoint));
        }

        return builder.build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        AwsBasicCredentials creds = AwsBasicCredentials.create(accessKey, secretKey);

        S3Presigner.Builder builder = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(creds))
                .serviceConfiguration(
                        S3Configuration.builder()
                                .pathStyleAccessEnabled(forcePathStyle)
                                .build()
                );

        if (endpoint != null && !endpoint.isBlank()) {
            builder = builder.endpointOverride(URI.create(endpoint));
        }

        return builder.build();
    }
}
