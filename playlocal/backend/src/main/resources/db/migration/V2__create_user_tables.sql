-- PlayLocal Database Schema V2: User Tables
-- Implements: user, user_role, user_privacy_settings, user_consent, block

-- =============================================
-- USER & AUTH TABLES
-- =============================================

CREATE TABLE "user" (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    phone_e164 VARCHAR(20),
    status user_status NOT NULL DEFAULT 'ACTIVE',
    deleted_at TIMESTAMP,
    default_intensity VARCHAR(50),  -- beginner, casual, competitive
    
    -- Reliability metrics (computed from attendance)
    reliability_score FLOAT DEFAULT 100.0,
    attended_count INT DEFAULT 0,
    no_show_count INT DEFAULT 0,
    games_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    
    -- Age confirmation (Legal P1: minimum age 13+)
    age_confirmed_at TIMESTAMP,
    
    -- SOFT DELETE POLICY: Never hard-delete, mask PII on soft delete
    -- Email uniqueness with soft delete support (Postgres partial unique)
    CONSTRAINT ck_user_reliability_score CHECK (reliability_score >= 0 AND reliability_score <= 100),
    CONSTRAINT ck_user_counts_nonnegative CHECK (attended_count >= 0 AND no_show_count >= 0 AND games_count >= 0)
);

-- Email uniqueness: only active users must have unique emails (allows reuse after soft delete)
CREATE UNIQUE INDEX ux_user_email_active ON "user"(LOWER(email)) WHERE deleted_at IS NULL;

-- User roles (RBAC)
CREATE TABLE user_role (
    user_role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(user_id),
    role_id UUID NOT NULL REFERENCES role(role_id),
    granted_by_user_id UUID REFERENCES "user"(user_id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    
    -- One active role assignment per user/role combo
    CONSTRAINT uq_user_role_active UNIQUE (user_id, role_id)
);

-- User privacy settings
CREATE TABLE user_privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES "user"(user_id),
    profile_visibility_id UUID REFERENCES content_visibility(content_visibility_id),
    skills_visibility_id UUID REFERENCES content_visibility(content_visibility_id),
    history_visibility_id UUID REFERENCES content_visibility(content_visibility_id),
    media_default_visibility_id UUID REFERENCES content_visibility(content_visibility_id),
    location_visibility_rule_id UUID REFERENCES location_visibility_rule(location_visibility_rule_id),
    allow_profile_search BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User consent records (EULA, privacy policy acceptance)
CREATE TABLE user_consent (
    consent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(user_id),
    policy_id UUID NOT NULL REFERENCES policy_document(policy_id),
    consent_type VARCHAR(50),  -- 'eula', 'privacy', 'email_marketing', 'location'
    accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_hash VARCHAR(64),  -- SHA-256 hash of IP for audit (not storing raw IP)
    
    -- Track version acceptance for re-consent on major updates
    CONSTRAINT uq_user_consent_policy UNIQUE (user_id, policy_id)
);

-- Block functionality (DEI P0: Safety)
CREATE TABLE block (
    block_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_user_id UUID NOT NULL REFERENCES "user"(user_id),
    blocked_user_id UUID NOT NULL REFERENCES "user"(user_id),
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Cannot block yourself
    CONSTRAINT ck_block_not_self CHECK (blocker_user_id <> blocked_user_id),
    -- One block per pair
    CONSTRAINT uq_block_pair UNIQUE (blocker_user_id, blocked_user_id)
);

-- Friendship (Deferred for MVP, but structure in place)
CREATE TABLE friendship (
    friendship_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_user_id UUID NOT NULL REFERENCES "user"(user_id),
    addressee_user_id UUID NOT NULL REFERENCES "user"(user_id),
    
    -- Canonical ordering for uniqueness (prevents A->B and B->A duplicates)
    user_low_id UUID NOT NULL REFERENCES "user"(user_id),
    user_high_id UUID NOT NULL REFERENCES "user"(user_id),
    
    status friendship_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    
    -- Integrity constraints
    CONSTRAINT ck_friendship_not_self CHECK (requester_user_id <> addressee_user_id),
    CONSTRAINT ck_friendship_low_high CHECK (user_low_id < user_high_id),
    CONSTRAINT uq_friendship_pair UNIQUE (user_low_id, user_high_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_user_status ON "user"(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_reliability ON "user"(reliability_score) WHERE deleted_at IS NULL;
CREATE INDEX idx_block_blocker ON block(blocker_user_id);
CREATE INDEX idx_block_blocked ON block(blocked_user_id);
CREATE INDEX idx_friendship_requester ON friendship(requester_user_id);
CREATE INDEX idx_friendship_addressee ON friendship(addressee_user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user.updated_at
CREATE TRIGGER tr_user_updated_at
    BEFORE UPDATE ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
