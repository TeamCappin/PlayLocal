-- PlayLocal Database Schema V15: Community Tags and Age Requirements
-- Implements: US-4.2 Community-Specific Game Filters

-- =============================================
-- UPDATE GAME_TAG TABLE - Add restricted flag
-- =============================================

-- Add column to mark tags that require confirmation
ALTER TABLE game_tag ADD COLUMN is_restricted BOOLEAN DEFAULT FALSE;

-- Clear existing seed data
DELETE FROM game_tag_assignment;
DELETE FROM game_tag;

-- Seed predefined community tags
INSERT INTO game_tag (tag_type, name, is_system_tag, is_restricted) VALUES
    ('community', 'women', TRUE, TRUE),
    ('community', 'men', TRUE, TRUE),
    ('community', 'deaf-friendly', TRUE, FALSE),
    ('community', 'beginner-friendly', TRUE, FALSE),
    ('community', 'casual', TRUE, FALSE),
    ('language', 'french-speaking', TRUE, FALSE),
    ('language', 'spanish-speaking', TRUE, FALSE);

-- =============================================
-- ADD AGE REQUIREMENTS TO GAME TABLE
-- =============================================

ALTER TABLE game ADD COLUMN min_age INTEGER;
ALTER TABLE game ADD COLUMN max_age INTEGER;

-- Add constraint to ensure valid age ranges
ALTER TABLE game ADD CONSTRAINT ck_game_age_range 
    CHECK (min_age IS NULL OR max_age IS NULL OR max_age >= min_age);
ALTER TABLE game ADD CONSTRAINT ck_game_min_age_valid 
    CHECK (min_age IS NULL OR (min_age >= 13 AND min_age <= 120));
ALTER TABLE game ADD CONSTRAINT ck_game_max_age_valid 
    CHECK (max_age IS NULL OR (max_age >= 13 AND max_age <= 120));

-- =============================================
-- GAME TAG CONFIRMATION TABLE
-- =============================================

-- Track confirmations when users join games with restricted tags
CREATE TABLE game_tag_confirmation (
    confirmation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(user_id),
    game_id UUID NOT NULL REFERENCES game(game_id),
    tag_id UUID NOT NULL REFERENCES game_tag(tag_id),
    confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- One confirmation per user per game per tag
    CONSTRAINT uq_user_game_tag_confirmation UNIQUE (user_id, game_id, tag_id)
);

CREATE INDEX idx_tag_confirmation_user ON game_tag_confirmation(user_id);
CREATE INDEX idx_tag_confirmation_game ON game_tag_confirmation(game_id);
CREATE INDEX idx_tag_confirmation_tag ON game_tag_confirmation(tag_id);

-- Composite index for efficient lookup during join validation
CREATE INDEX idx_tag_confirmation_user_game ON game_tag_confirmation(user_id, game_id);
