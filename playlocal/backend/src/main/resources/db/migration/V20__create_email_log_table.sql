-- Email log table for tracking transactional emails
CREATE TABLE IF NOT EXISTS email_log (
    email_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    email_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    resend_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_log_recipient ON email_log(recipient_email);
CREATE INDEX idx_email_log_type ON email_log(email_type);
CREATE INDEX idx_email_log_created_at ON email_log(created_at);
