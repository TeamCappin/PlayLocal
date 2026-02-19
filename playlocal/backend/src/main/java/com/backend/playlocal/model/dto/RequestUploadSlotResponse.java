package com.backend.playlocal.model.dto;

import java.util.UUID;

public class RequestUploadSlotResponse {
    private UUID mediaId;
    private String uploadUrl;  // presigned PUT url
    private String storageKey;  // stored in storage_url (key/path)

    public RequestUploadSlotResponse() {}

    public RequestUploadSlotResponse(UUID mediaId, String uploadUrl, String storageKey) {
        this.mediaId = mediaId;
        this.uploadUrl = uploadUrl;
        this.storageKey = storageKey;
    }

    public UUID getMediaId() { return mediaId; }
    public void setMediaId(UUID mediaId) { this.mediaId = mediaId; }

    public String getUploadUrl() { return uploadUrl; }
    public void setUploadUrl(String uploadUrl) { this.uploadUrl = uploadUrl; }

    public String getObjectKey() { return storageKey; }
    public void setObjectKey(String objectKey) { this.storageKey = objectKey; }
}
