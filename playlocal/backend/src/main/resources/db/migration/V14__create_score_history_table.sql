-- PlayLocal Database Schema V11: Score History Table
-- Implements: US 2.7 - Reliability Score History (Audit Trail)
-- Each score change is logged with: userId, delta, reason, gameId, timestamp

CREATE TABLE score_history (
    score_history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(user_id),
    game_id UUID REFERENCES game(game_id),  -- nullable for manual adjustments
    
    -- Score change details
    previous_score FLOAT NOT NULL,
    new_score FLOAT NOT NULL,
    delta FLOAT NOT NULL,  -- positive or negative change
    
    -- Reason for the change
    reason VARCHAR(50) NOT NULL,  -- 'ATTENDANCE', 'NO_SHOW', 'MANUAL_ADJUSTMENT', 'DISPUTE_RESOLVED'
    description VARCHAR(255),  -- optional detailed description
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id UUID REFERENCES "user"(user_id),  -- who triggered the change (organizer, admin, etc.)
    
    -- Constraints
    CONSTRAINT ck_score_history_scores CHECK (previous_score >= 0 AND previous_score <= 100),
    CONSTRAINT ck_score_history_new_score CHECK (new_score >= 0 AND new_score <= 100),
    CONSTRAINT ck_score_history_reason CHECK (reason IN ('ATTENDANCE', 'NO_SHOW', 'MANUAL_ADJUSTMENT', 'DISPUTE_RESOLVED'))
);

-- Indexes for efficient queries
CREATE INDEX idx_score_history_user ON score_history(user_id);
CREATE INDEX idx_score_history_user_created ON score_history(user_id, created_at DESC);
CREATE INDEX idx_score_history_game ON score_history(game_id) WHERE game_id IS NOT NULL;

-- Comment for documentation
COMMENT ON TABLE score_history IS 'Audit trail for reliability score changes (US 2.7)';
COMMENT ON COLUMN score_history.delta IS 'Score change amount: positive for increases, negative for decreases';
COMMENT ON COLUMN score_history.reason IS 'Category of score change: ATTENDANCE (showed up), NO_SHOW (did not attend), MANUAL_ADJUSTMENT (admin), DISPUTE_RESOLVED (after review)';
