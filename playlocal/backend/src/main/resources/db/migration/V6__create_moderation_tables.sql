-- PlayLocal Database Schema V6: Moderation & Reporting Tables
-- Implements: report, audit_log, team balancing, ratings, match records, media

-- =============================================
-- REPORTS (Safety & Moderation)
-- =============================================

CREATE TABLE report (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_user_id UUID NOT NULL REFERENCES "user"(user_id),
    
    -- Report target (exactly one must be non-null)
    reported_user_id UUID REFERENCES "user"(user_id),
    game_id UUID REFERENCES game(game_id),
    media_id UUID,  -- FK added after media_asset is created
    match_record_id UUID,  -- FK added after match_record is created
    match_record_revision_id UUID,  -- FK added after match_record_revision is created
    
    report_type report_type NOT NULL,
    details TEXT,
    status report_status NOT NULL DEFAULT 'OPEN',
    
    -- Resolution
    handled_by_user_id UUID REFERENCES "user"(user_id),
    resolution_action VARCHAR(100),  -- 'warned', 'suspended', 'banned', 'content_removed', etc.
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    
    -- Exactly one target (recommended)
    CONSTRAINT ck_report_single_target CHECK (
        (CASE WHEN reported_user_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN game_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN media_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN match_record_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN match_record_revision_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

CREATE INDEX idx_report_status ON report(status);
CREATE INDEX idx_report_reporter ON report(reporter_user_id);
CREATE INDEX idx_report_reported_user ON report(reported_user_id);
CREATE INDEX idx_report_created ON report(created_at);

-- =============================================
-- AUDIT LOG (Required for moderation accountability)
-- =============================================

CREATE TABLE audit_log (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID NOT NULL REFERENCES "user"(user_id),
    action_type audit_action_type NOT NULL,
    target_type target_type NOT NULL,
    target_id UUID NOT NULL,
    metadata_json JSONB,  -- additional context
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_actor ON audit_log(actor_user_id);
CREATE INDEX idx_audit_action ON audit_log(action_type);
CREATE INDEX idx_audit_target ON audit_log(target_type, target_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- =============================================
-- TEAM BALANCE RUNS
-- =============================================

CREATE TABLE team_balance_run (
    balance_run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES game(game_id),
    created_by_participation_id UUID NOT NULL,
    mode balance_mode NOT NULL,
    constraints_json JSONB,
    justification_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Required composite unique for FK from assignments
    CONSTRAINT uq_balance_run_game UNIQUE (balance_run_id, game_id),
    
    -- Creator must be a participant
    CONSTRAINT fk_balance_creator FOREIGN KEY (game_id, created_by_participation_id)
        REFERENCES game_participation(game_id, participation_id)
);

CREATE TABLE team_balance_assignment (
    balance_assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    balance_run_id UUID NOT NULL,
    game_id UUID NOT NULL,
    participation_id UUID NOT NULL,
    team_id UUID NOT NULL,
    rationale_text TEXT,
    
    -- Composite FKs
    CONSTRAINT fk_assignment_run FOREIGN KEY (balance_run_id, game_id)
        REFERENCES team_balance_run(balance_run_id, game_id),
    CONSTRAINT fk_assignment_participation FOREIGN KEY (game_id, participation_id)
        REFERENCES game_participation(game_id, participation_id),
    CONSTRAINT fk_assignment_team FOREIGN KEY (game_id, team_id)
        REFERENCES team(game_id, team_id),
    
    -- One assignment per participation per run
    CONSTRAINT uq_assignment_participation UNIQUE (balance_run_id, participation_id)
);

-- =============================================
-- MATCH RECORDS
-- =============================================

CREATE TABLE match_record (
    match_record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES game(game_id),
    recorded_by_participation_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- One match record per game
    CONSTRAINT uq_match_record_game UNIQUE (game_id),
    
    -- Recorded by must be a participant
    CONSTRAINT fk_match_record_recorder FOREIGN KEY (game_id, recorded_by_participation_id)
        REFERENCES game_participation(game_id, participation_id)
);

CREATE TABLE match_record_revision (
    match_record_revision_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_record_id UUID NOT NULL REFERENCES match_record(match_record_id),
    revision_number INT NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id UUID NOT NULL REFERENCES "user"(user_id),
    outcome_json JSONB,
    stats_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Version uniqueness
    CONSTRAINT uq_revision_number UNIQUE (match_record_id, revision_number)
);

-- Only one current revision per match record
CREATE UNIQUE INDEX ux_match_record_current ON match_record_revision(match_record_id) 
    WHERE is_current = TRUE;

-- =============================================
-- MEDIA ASSETS
-- =============================================

CREATE TABLE IF NOT EXISTS media_asset (
    media_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_user_id UUID NOT NULL REFERENCES "user"(user_id),
    game_id UUID REFERENCES game(game_id),
    match_record_revision_id UUID REFERENCES match_record_revision(match_record_revision_id),
    media_type media_type NULL,
    storage_url VARCHAR(500) NULL,
    thumbnail_url VARCHAR(500) NULL,
    visibility_id UUID NULL REFERENCES content_visibility(content_visibility_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delete_after TIMESTAMP NULL,  -- retention policy
    deleted_at TIMESTAMP NULL

    -- XOR parent: either game or match_record_revision, not both
    --CONSTRAINT ck_media_parent CHECK (
        --(game_id IS NOT NULL) <> (match_record_revision_id IS NOT NULL)
    --)
);

-- Add FK from report to media
ALTER TABLE report ADD CONSTRAINT fk_report_media FOREIGN KEY (media_id) REFERENCES media_asset(media_id);
ALTER TABLE report ADD CONSTRAINT fk_report_match_record FOREIGN KEY (match_record_id) REFERENCES match_record(match_record_id);
ALTER TABLE report ADD CONSTRAINT fk_report_revision FOREIGN KEY (match_record_revision_id) REFERENCES match_record_revision(match_record_revision_id);

CREATE TABLE media_tag (
    media_tag_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID NOT NULL REFERENCES media_asset(media_id),
    tagged_user_id UUID REFERENCES "user"(user_id),
    tag_type tag_type NOT NULL,
    timestamp_seconds INT,  -- for video timestamps
    note TEXT,

    -- Tag type constraints
    CONSTRAINT ck_player_tag CHECK (tag_type <> 'player' OR tagged_user_id IS NOT NULL),
    CONSTRAINT ck_timestamp_positive CHECK (timestamp_seconds IS NULL OR timestamp_seconds >= 0)
);

-- =============================================
-- RATINGS (Participants-only)
-- =============================================

CREATE TABLE rating (
    rating_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES game(game_id),
    rater_participation_id UUID NOT NULL,
    ratee_participation_id UUID NOT NULL,
    rating_value INT NOT NULL,
    rating_type VARCHAR(50) NOT NULL,  -- 'sportsmanship', 'skill', 'reliability', etc.
    comment TEXT,
    visibility_id UUID NOT NULL REFERENCES content_visibility(content_visibility_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Participants-only FKs
    CONSTRAINT fk_rating_rater FOREIGN KEY (game_id, rater_participation_id)
        REFERENCES game_participation(game_id, participation_id),
    CONSTRAINT fk_rating_ratee FOREIGN KEY (game_id, ratee_participation_id)
        REFERENCES game_participation(game_id, participation_id),
    
    -- Cannot rate yourself
    CONSTRAINT ck_rating_not_self CHECK (rater_participation_id <> ratee_participation_id),
    -- One rating per type per rater/ratee pair per game
    CONSTRAINT uq_rating UNIQUE (game_id, rater_participation_id, ratee_participation_id, rating_type),
    -- Rating value range
    CONSTRAINT ck_rating_value CHECK (rating_value >= 1 AND rating_value <= 5)
);

-- =============================================
-- GAME RECAPS (AI-generated summaries - deferred but structure in place)
-- =============================================

CREATE TABLE game_recap (
    recap_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_record_revision_id UUID NOT NULL REFERENCES match_record_revision(match_record_revision_id),
    generated_by_user_id UUID REFERENCES "user"(user_id),
    generator VARCHAR(50),  -- 'ai', 'manual', etc.
    recap_text TEXT,
    visibility_id UUID NOT NULL REFERENCES content_visibility(content_visibility_id),
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SHARE LINKS
-- =============================================

CREATE TABLE game_share_link (
    share_link_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES game(game_id),
    created_by_user_id UUID NOT NULL REFERENCES "user"(user_id),
    token VARCHAR(100) NOT NULL,
    visibility_id UUID NOT NULL REFERENCES content_visibility(content_visibility_id),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_game_share_token UNIQUE (token)
);

CREATE TABLE media_share_link (
    share_link_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID NOT NULL REFERENCES media_asset(media_id),
    created_by_user_id UUID NOT NULL REFERENCES "user"(user_id),
    token VARCHAR(100) NOT NULL,
    visibility_id UUID NOT NULL REFERENCES content_visibility(content_visibility_id),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_media_share_token UNIQUE (token)
);

CREATE TABLE recap_share_link (
    share_link_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recap_id UUID NOT NULL REFERENCES game_recap(recap_id),
    created_by_user_id UUID NOT NULL REFERENCES "user"(user_id),
    token VARCHAR(100) NOT NULL,
    visibility_id UUID NOT NULL REFERENCES content_visibility(content_visibility_id),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_recap_share_token UNIQUE (token)
);

CREATE TABLE match_record_share_link (
    share_link_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_record_id UUID NOT NULL REFERENCES match_record(match_record_id),
    created_by_user_id UUID NOT NULL REFERENCES "user"(user_id),
    token VARCHAR(100) NOT NULL,
    visibility_id UUID NOT NULL REFERENCES content_visibility(content_visibility_id),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_match_share_token UNIQUE (token)
);

-- =============================================
-- ORGANIZER TRUST (Deferred, but structure for future)
-- =============================================

CREATE TABLE organizer_quality_score (
    user_id UUID PRIMARY KEY REFERENCES "user"(user_id),
    oqs_score FLOAT,
    game_completion_rate FLOAT,
    repeat_player_rate FLOAT,
    last_calculated_at TIMESTAMP
);

CREATE TABLE organizer_verification (
    organizer_verification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(user_id),
    provider VARCHAR(100),  -- 'club', 'campus', 'manual'
    status verification_status NOT NULL DEFAULT 'PENDING',
    verified_at TIMESTAMP,
    reference_id VARCHAR(255)
);
