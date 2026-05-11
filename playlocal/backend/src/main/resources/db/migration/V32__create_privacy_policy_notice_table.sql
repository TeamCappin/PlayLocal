CREATE TABLE IF NOT EXISTS privacy_policy_notice (
    notice_id SMALLINT PRIMARY KEY,
    last_updated DATE NOT NULL,
    effective_date DATE NOT NULL,
    updated_by_email VARCHAR(320),
    recipients_targeted INT NOT NULL DEFAULT 0,
    emails_sent INT NOT NULL DEFAULT 0,
    emails_failed INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_privacy_policy_notice_singleton CHECK (notice_id = 1),
    CONSTRAINT ck_privacy_policy_notice_non_negative
        CHECK (recipients_targeted >= 0 AND emails_sent >= 0 AND emails_failed >= 0)
);