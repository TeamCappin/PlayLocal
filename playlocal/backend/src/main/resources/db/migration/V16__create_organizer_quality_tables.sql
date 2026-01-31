-- PlayLocal Database Schema V16: Organizer Quality Score Tables
-- Implements: US-6.1 - Organizer Quality Score (OQS)
-- 
-- OQS is calculated from objective metrics:
-- - Game completion rate (completed / total games hosted)
-- - Repeat player rate (players who join more than once / total unique players)

-- =============================================
-- CLEANUP: Drop old tables if they exist (handles partial migrations)
-- =============================================

DROP TRIGGER IF EXISTS tr_oqs_updated_at ON organizer_quality_score;
DROP INDEX IF EXISTS idx_oqs_score;
DROP INDEX IF EXISTS idx_oqs_games_hosted;
DROP INDEX IF EXISTS idx_oqs_history_organizer;
DROP INDEX IF EXISTS idx_oqs_history_organizer_created;
DROP INDEX IF EXISTS idx_oqs_history_game;
DROP TABLE IF EXISTS organizer_score_history;
DROP TABLE IF EXISTS organizer_quality_score;

-- =============================================
-- ORGANIZER QUALITY SCORE TABLE
-- =============================================

CREATE TABLE organizer_quality_score (
    user_id UUID PRIMARY KEY REFERENCES "user"(user_id),
    
    -- Calculated OQS score (weighted average of metrics)
    oqs_score FLOAT NOT NULL DEFAULT 100.0,
    
    -- Individual metrics
    game_completion_rate FLOAT NOT NULL DEFAULT 100.0,
    repeat_player_rate FLOAT NOT NULL DEFAULT 0.0,
    
    -- Raw counts for metrics calculation
    total_games_hosted INT NOT NULL DEFAULT 0,
    completed_games INT NOT NULL DEFAULT 0,
    cancelled_games INT NOT NULL DEFAULT 0,
    total_unique_players INT NOT NULL DEFAULT 0,
    repeat_players INT NOT NULL DEFAULT 0,
    
    -- Timestamps
    last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT ck_oqs_score CHECK (oqs_score >= 0 AND oqs_score <= 100),
    CONSTRAINT ck_oqs_completion_rate CHECK (game_completion_rate >= 0 AND game_completion_rate <= 100),
    CONSTRAINT ck_oqs_repeat_rate CHECK (repeat_player_rate >= 0 AND repeat_player_rate <= 100),
    CONSTRAINT ck_oqs_counts_nonnegative CHECK (
        total_games_hosted >= 0 AND 
        completed_games >= 0 AND 
        cancelled_games >= 0 AND
        total_unique_players >= 0 AND
        repeat_players >= 0
    )
);

-- Index for efficient lookups
CREATE INDEX idx_oqs_score ON organizer_quality_score(oqs_score DESC);
CREATE INDEX idx_oqs_games_hosted ON organizer_quality_score(total_games_hosted DESC);

-- =============================================
-- ORGANIZER SCORE HISTORY TABLE (Audit Log)
-- =============================================

CREATE TABLE organizer_score_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES "user"(user_id),
    game_id UUID REFERENCES game(game_id),  -- nullable for manual adjustments
    
    -- Score change details
    previous_oqs FLOAT NOT NULL,
    new_oqs FLOAT NOT NULL,
    delta FLOAT NOT NULL,
    
    -- Individual metric changes (for detailed audit)
    previous_completion_rate FLOAT,
    new_completion_rate FLOAT,
    previous_repeat_rate FLOAT,
    new_repeat_rate FLOAT,
    
    -- Reason for the change
    reason VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
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

-- Indexes for efficient queries
CREATE INDEX idx_oqs_history_organizer ON organizer_score_history(organizer_id);
CREATE INDEX idx_oqs_history_organizer_created ON organizer_score_history(organizer_id, created_at DESC);
CREATE INDEX idx_oqs_history_game ON organizer_score_history(game_id) WHERE game_id IS NOT NULL;

-- =============================================
-- TRIGGER FOR UPDATED_AT
-- =============================================

CREATE TRIGGER tr_oqs_updated_at
    BEFORE UPDATE ON organizer_quality_score
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE organizer_quality_score IS 'Organizer Quality Score (OQS) metrics per user (US-6.1)';
COMMENT ON COLUMN organizer_quality_score.oqs_score IS 'Overall OQS: weighted average of completion rate (60%) and repeat player rate (40%)';
COMMENT ON COLUMN organizer_quality_score.game_completion_rate IS 'Percentage of games completed vs total games (completed + cancelled)';
COMMENT ON COLUMN organizer_quality_score.repeat_player_rate IS 'Percentage of players who joined multiple games by this organizer';
COMMENT ON COLUMN organizer_quality_score.total_games_hosted IS 'Count of completed + cancelled games (for confidence indicator)';

COMMENT ON TABLE organizer_score_history IS 'Audit trail for OQS changes (US-6.1)';
COMMENT ON COLUMN organizer_score_history.reason IS 'Category of OQS change: GAME_COMPLETED, GAME_CANCELLED, PLAYER_RETURNED, INITIAL_CALCULATION, MANUAL_ADJUSTMENT, RECALCULATION';