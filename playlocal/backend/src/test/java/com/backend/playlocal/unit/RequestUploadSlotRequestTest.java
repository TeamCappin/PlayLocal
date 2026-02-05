package com.backend.playlocal.unit;

import com.backend.playlocal.model.dto.RequestUploadSlotRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RequestUploadSlotRequestTest {

    @Test
    @DisplayName("RequestUploadSlotRequest should support constructors and getters/setters")
    void requestUploadSlotRequest_Basics() {
        // Arrange
        RequestUploadSlotRequest req = new RequestUploadSlotRequest("image/png", "pic.png");

        // Act
        req.setSizeBytes(123L);

        // Assert
        assertThat(req.getContentType()).isEqualTo("image/png");
        assertThat(req.getFileName()).isEqualTo("pic.png");
        assertThat(req.getSizeBytes()).isEqualTo(123L);
    }

    @Test
    @DisplayName("RequestUploadSlotRequest no-args constructor should create mutable object")
    void requestUploadSlotRequest_NoArgsConstructor() {
        // Arrange
        RequestUploadSlotRequest req = new RequestUploadSlotRequest();

        // Act
        req.setContentType("image/jpeg");
        req.setFileName("a.jpg");
        req.setSizeBytes(999L);

        // Assert
        assertThat(req.getContentType()).isEqualTo("image/jpeg");
        assertThat(req.getFileName()).isEqualTo("a.jpg");
        assertThat(req.getSizeBytes()).isEqualTo(999L);
    }
}
