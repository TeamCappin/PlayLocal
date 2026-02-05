package com.backend.playlocal.unit;

import com.backend.playlocal.config.S3Config;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for S3Config bean builders (no Spring context).
 */
class S3ConfigTest {

    private static void setPrivateField(Object target, String fieldName, Object value) {
        try {
            Field f = target.getClass().getDeclaredField(fieldName);
            f.setAccessible(true);
            f.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set field: " + fieldName, e);
        }
    }

    @Test
    @DisplayName("s3Client should build successfully when endpoint is blank (AWS-style)")
    void s3Client_BuildsWithBlankEndpoint() {
        // Arrange
        S3Config config = new S3Config();
        setPrivateField(config, "endpoint", "");
        setPrivateField(config, "region", "us-east-1");
        setPrivateField(config, "accessKey", "dummy");
        setPrivateField(config, "secretKey", "dummy");
        setPrivateField(config, "forcePathStyle", false);

        // Act
        S3Client client = config.s3Client();

        // Assert
        assertThat(client).isNotNull();
        assertThat(client.serviceName()).isEqualTo("s3");
    }

    @Test
    @DisplayName("s3Presigner should build successfully when endpoint is blank (AWS-style)")
    void s3Presigner_BuildsWithBlankEndpoint() {
        // Arrange
        S3Config config = new S3Config();
        setPrivateField(config, "endpoint", "");
        setPrivateField(config, "region", "us-east-1");
        setPrivateField(config, "accessKey", "dummy");
        setPrivateField(config, "secretKey", "dummy");
        setPrivateField(config, "forcePathStyle", false);

        // Act
        S3Presigner presigner = config.s3Presigner();

        // Assert
        assertThat(presigner).isNotNull();
    }

    @Test
    @DisplayName("s3Client and s3Presigner should build successfully when endpoint is provided (MinIO-style)")
    void buildsWithEndpointOverride() {
        // Arrange
        S3Config config = new S3Config();
        setPrivateField(config, "endpoint", "http://localhost:9000");
        setPrivateField(config, "region", "us-east-1");
        setPrivateField(config, "accessKey", "minioadmin");
        setPrivateField(config, "secretKey", "minioadmin");
        setPrivateField(config, "forcePathStyle", true);

        // Act
        S3Client client = config.s3Client();
        S3Presigner presigner = config.s3Presigner();

        // Assert
        assertThat(client).isNotNull();
        assertThat(presigner).isNotNull();
    }
}
