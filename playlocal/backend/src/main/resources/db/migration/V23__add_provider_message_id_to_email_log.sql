ALTER TABLE email_log
    ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(255);