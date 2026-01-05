-- PlayLocal Database Schema V4: Game & Location Tables
-- Implements: location, game_template, game, game_tag, game_tag_assignment

-- =============================================
-- LOCATIONS
-- =============================================

CREATE TABLE location (
    location_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    address_line VARCHAR(500),
    city VARCHAR(100),
    region VARCHAR(100),  -- province/state
    country VARCHAR(100) DEFAULT 'Canada',
    postal_code VARCHAR(20),
    latitude FLOAT,
    longitude FLOAT,
    google_place_id VARCHAR(255),
    notes TEXT,
    
    -- Earth coordinate sanity checks
    CONSTRAINT ck_latitude CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    CONSTRAINT ck_longitude CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

CREATE INDEX idx_location_coords ON location(latitude, longitude);
CREATE INDEX idx_location_city ON location(city);

-- =============================================
-- GAME TEMPLATES
-- =============================================

CREATE TABLE game_template (
    game_template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES "user"(user_id),
    sport_id UUID NOT NULL REFERENCES sport(sport_id),
    title VARCHAR(255),
    indoor_outdoor VARCHAR(20),  -- 'indoor', 'outdoor', 'both'
    intensity_band VARCHAR(50),  -- 'beginner', 'casual', 'competitive'
    min_players INT,
    max_players INT,
    skill_band VARCHAR(50),
    allow_waitlist BOOLEAN DEFAULT TRUE,
    require_checkin BOOLEAN DEFAULT FALSE,
    min_reliability_required FLOAT,
    defaults_json JSONB,  -- additional default settings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ck_template_players CHECK (min_players IS NULL OR max_players IS NULL OR max_players >= min_players)
);

CREATE INDEX idx_game_template_owner ON game_template(owner_user_id);

-- =============================================
-- GAMES
-- =============================================

CREATE TABLE game (
    game_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by_user_id UUID NOT NULL REFERENCES "user"(user_id),
    sport_id UUID NOT NULL REFERENCES sport(sport_id),
    location_id UUID NOT NULL REFERENCES location(location_id),
    game_template_id UUID REFERENCES game_template(game_template_id),
    
    -- Basic info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    indoor_outdoor VARCHAR(20),
    
    -- Visibility
    visibility_id UUID NOT NULL REFERENCES game_visibility(game_visibility_id),
    location_visibility_rule_id UUID REFERENCES location_visibility_rule(location_visibility_rule_id),
    
    -- Game settings
    intensity_band VARCHAR(50),
    skill_band VARCHAR(50),
    min_players INT NOT NULL DEFAULT 2,
    max_players INT NOT NULL DEFAULT 20,
    allow_waitlist BOOLEAN DEFAULT TRUE,
    min_reliability_required FLOAT,  -- MVP: Reputation-gated games (MVP-014)
    
    -- Timing
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    timezone VARCHAR(50) DEFAULT 'America/Montreal',
    
    -- Lifecycle
    status game_status NOT NULL DEFAULT 'SCHEDULED',
    
    -- Check-in
    checkin_open_at TIMESTAMP,
    checkin_close_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- Required composite unique for FK enforcement
    CONSTRAINT uq_game_sport UNIQUE (game_id, sport_id),
    
    -- Time sanity checks
    CONSTRAINT ck_game_time CHECK (end_time IS NULL OR end_time > start_time),
    CONSTRAINT ck_checkin_time CHECK (
        checkin_close_at IS NULL OR checkin_open_at IS NULL OR checkin_close_at >= checkin_open_at
    ),
    CONSTRAINT ck_game_players CHECK (min_players > 0 AND max_players >= min_players),
    CONSTRAINT ck_min_reliability CHECK (min_reliability_required IS NULL OR (min_reliability_required >= 0 AND min_reliability_required <= 100))
);

-- Indexes for discovery queries
CREATE INDEX idx_game_status ON game(status);
CREATE INDEX idx_game_start_time ON game(start_time);
CREATE INDEX idx_game_sport ON game(sport_id);
CREATE INDEX idx_game_location ON game(location_id);
CREATE INDEX idx_game_creator ON game(created_by_user_id);

-- Trigger for updated_at
CREATE TRIGGER tr_game_updated_at
    BEFORE UPDATE ON game
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- GAME TAGS (for categorization/filtering)
-- =============================================

CREATE TABLE game_tag (
    tag_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_type VARCHAR(50) NOT NULL,  -- 'community', 'skill', 'style', etc.
    name VARCHAR(100) NOT NULL,
    is_system_tag BOOLEAN DEFAULT FALSE  -- system tags vs user-created
);

-- Seed community tags (for future community-specific filters - DEF-012)
INSERT INTO game_tag (tag_type, name, is_system_tag) VALUES
    ('community', 'Beginner-friendly', TRUE),
    ('community', 'Women-only', TRUE),
    ('community', 'LGBTQ+ Friendly', TRUE),
    ('community', 'Over-30s', TRUE),
    ('community', 'Over-40s', TRUE),
    ('intensity', 'Casual', TRUE),
    ('intensity', 'Competitive', TRUE),
    ('accessibility', 'Wheelchair Accessible', TRUE);

CREATE TABLE game_tag_assignment (
    game_tag_assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES game(game_id),
    tag_id UUID NOT NULL REFERENCES game_tag(tag_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- One tag assignment per game/tag combo
    CONSTRAINT uq_game_tag UNIQUE (game_id, tag_id)
);

CREATE INDEX idx_game_tag_assignment_game ON game_tag_assignment(game_id);
