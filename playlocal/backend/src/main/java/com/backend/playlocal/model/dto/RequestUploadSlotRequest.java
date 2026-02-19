
package com.backend.playlocal.model.dto;

public class RequestUploadSlotRequest {
    private String contentType;   // e.g. "image/jpeg"
    private String fileName;      // optional, for logging/display
    private Long sizeBytes;

    public RequestUploadSlotRequest() {}

    public RequestUploadSlotRequest(String contentType, String fileName) {
        this.contentType = contentType;
        this.fileName = fileName;
    }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public Long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(Long sizeBytes) { this.sizeBytes = sizeBytes; }
}
