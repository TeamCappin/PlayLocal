CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_provider_message_id_unique
    ON notification(provider_message_id)
    WHERE provider_message_id IS NOT NULL;
