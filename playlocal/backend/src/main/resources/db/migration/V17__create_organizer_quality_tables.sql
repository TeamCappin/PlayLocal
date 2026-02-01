-- PlayLocal Database Schema V16: Organizer Quality Score Tables
-- Implements: US-6.1 - Organizer Quality Score (OQS)
-- 
-- Extends the basic organizer_quality_score table from V6 with additional metrics

-- =============================================
-- ALTER ORGANIZER QUALITY SCORE TABLE
-- =============================================

-- Add missing columns to existing table
ALTER TABLE organizer_quality_score
    ADD COLUMN IF NOT EXISTS total_games_hosted INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS completed_games INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cancelled_games INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_unique_players INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS repeat_players INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Set default values for existing columns if null
ALTER TABLE organizer_quality_score
    ALTER COLUMN oqs_score SET DEFAULT 100.0,
    ALTER COLUMN oqs_score SET NOT NULL,
    ALTER COLUMN game_completion_rate SET DEFAULT 100.0,
    ALTER COLUMN game_completion_rate SET NOT NULL,
    ALTER COLUMN repeat_player_rate SET DEFAULT 0.0,
    ALTER COLUMN repeat_player_rate SET NOT NULL;

-- Update any null values before adding constraints
UPDATE organizer_quality_score SET oqs_score = 100.0 WHERE oqs_score IS NULL;
UPDATE organizer_quality_score SET game_completion_rate = 100.0 WHERE game_completion_rate IS NULL;
UPDATE organizer_quality_score SET repeat_player_rate = 0.0 WHERE repeat_player_rate IS NULL;

-- Add constraints
ALTER TABLE organizer_quality_score
    ADD CONSTRAINT ck_oqs_score CHECK (oqs_score >= 0 AND oqs_score <= 100),
    ADD CONSTRAINT ck_oqs_completion_rate CHECK (game_completion_rate >= 0 AND game_completion_rate <= 100),
    ADD CONSTRAINT ck_oqs_repeat_rate CHECK (repeat_player_rate >= 0 AND repeat_player_rate <= 100),
    ADD CONSTRAINT ck_oqs_counts_nonnegative CHECK (
        total_games_hosted >= 0 AND 
        completed_games >= 0 AND 
        cancelled_games >= 0 AND
        total_unique_players >= 0 AND
        repeat_players >= 0
    );

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_oqs_score ON organizer_quality_score(oqs_score DESC);
CREATE INDEX IF NOT EXISTS idx_oqs_games_hosted ON organizer_quality_score(total_games_hosted DESC);

-- =============================================
-- ORGANIZER SCORE HISTORY TABLE (Audit Log)
-- =============================================

CREATE TABLE IF NOT EXISTS organizer_score_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES "user"(user_id),
    game_id UUID REFERENCES game(game_id),
    
    previous_oqs FLOAT NOT NULL,
    new_oqs FLOAT NOT NULL,
    delta FLOAT NOT NULL,
    
    previous_completion_rate FLOAT,
    new_completion_rate FLOAT,
    previous_repeat_rate FLOAT,
    new_repeat_rate FLOAT,
    
    reason VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ck_oqs_history_scores CHECK (previous_oqs >= 0 AND previous_oqs <= 100),
    CONSTRAINT ck_oqs_history_new_score CHECK (new_oqs >= 0 AND new_oqs <= 100),
    CONSTRAINT ck_oqs_history_reason CHECK (reason IN (
        'GAME_COMPLETED', 
        'GAME_CANCELLED', 
        'PLAYER_RETURNED', 
        'INITIAL_CALCULATION', 
        'MANUAL_ADJUSTMENT', 
        'RECALCULATION'
    ))
);

-- Indexes for history table
CREATE INDEX IF NOT EXISTS idx_oqs_history_organizer ON organizer_score_history(organizer_id);
CREATE INDEX IF NOT EXISTS idx_oqs_history_organizer_created ON organizer_score_history(organizer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oqs_history_game ON organizer_score_history(game_id) WHERE game_id IS NOT NULL;

-- =============================================
-- TRIGGER FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE TRIGGER tr_oqs_updated_at
    BEFORE UPDATE ON organizer_quality_score
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE organizer_quality_score IS 'Organizer Quality Score (OQS) metrics per user (US-6.1)';
COMMENT ON TABLE organizer_score_history IS 'Audit trail for OQS changes (US-6.1)';
