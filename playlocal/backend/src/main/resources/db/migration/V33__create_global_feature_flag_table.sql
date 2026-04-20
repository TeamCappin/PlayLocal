CREATE TABLE IF NOT EXISTS global_feature_flag (
    flag_key VARCHAR(100) PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(255),
    updated_by_user_id UUID REFERENCES "user"(user_id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO global_feature_flag (flag_key, is_enabled, description)
VALUES ('admin_ads_switch_on', TRUE, 'Admin runtime ad switch (ON/OFF)')
ON CONFLICT (flag_key) DO NOTHING;