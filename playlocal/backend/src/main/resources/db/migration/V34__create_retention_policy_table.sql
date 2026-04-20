CREATE TABLE IF NOT EXISTS retention_policy (
    policy_id SMALLINT PRIMARY KEY,
    target_name VARCHAR(100) NOT NULL UNIQUE,
    retention_days INTEGER NOT NULL CHECK (retention_days > 0),
    deletion_mode VARCHAR(30) NOT NULL DEFAULT 'HARD_DELETE',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO retention_policy (policy_id, target_name, retention_days, deletion_mode, enabled)
VALUES (1, 'analytics_event', 30, 'HARD_DELETE', TRUE)
ON CONFLICT (policy_id) DO NOTHING;