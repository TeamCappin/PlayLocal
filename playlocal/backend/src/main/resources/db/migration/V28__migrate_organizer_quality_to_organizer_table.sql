-- PlayLocal Database Schema V27: Migrate Organizer Tables to Use Organizer Entity
-- Implements: US-6.2 Task-6.2.1
-- 
-- Migrates organizer_quality_score and organizer_verification to reference
-- organizer table instead of user table (one-to-one with user via organizer)

-- =============================================
-- RENAME & RESTRUCTURE ORGANIZER_QUALITY_SCORE
-- =============================================

-- Create new organizer_quality_score table with organizer_id
CREATE TABLE IF NOT EXISTS organizer_quality_score_new (
    organizer_id UUID PRIMARY KEY UNIQUE REFERENCES organizer(organizer_id),
    oqs_score FLOAT,
    game_completion_rate FLOAT,
    repeat_player_rate FLOAT,
    total_games_hosted INT NOT NULL DEFAULT 0,
    completed_games INT NOT NULL DEFAULT 0,
    cancelled_games INT NOT NULL DEFAULT 0,
    total_unique_players INT NOT NULL DEFAULT 0,
    repeat_players INT NOT NULL DEFAULT 0,
    last_calculated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ck_oqs_score CHECK (oqs_score IS NULL OR (oqs_score >= 0 AND oqs_score <= 100)),
    CONSTRAINT ck_oqs_completion_rate CHECK (game_completion_rate IS NULL OR (game_completion_rate >= 0 AND game_completion_rate <= 100)),
    CONSTRAINT ck_oqs_repeat_rate CHECK (repeat_player_rate IS NULL OR (repeat_player_rate >= 0 AND repeat_player_rate <= 100)),
    CONSTRAINT ck_oqs_counts_nonnegative CHECK (
        total_games_hosted >= 0 AND 
        completed_games >= 0 AND 
        cancelled_games >= 0 AND
        total_unique_players >= 0 AND
        repeat_players >= 0
    )
);

-- Migrate data from old to new table (join through organizer to get organizer_id)
INSERT INTO organizer_quality_score_new (organizer_id, oqs_score, game_completion_rate, repeat_player_rate, last_calculated_at, created_at, updated_at)
SELECT o.organizer_id, oqs.oqs_score, oqs.game_completion_rate, oqs.repeat_player_rate, oqs.last_calculated_at, COALESCE(oqs.last_calculated_at, NOW()), NOW()
FROM organizer_quality_score oqs
INNER JOIN organizer o ON o.user_id = oqs.user_id
ON CONFLICT DO NOTHING;

-- Drop old table and rename new
DROP TABLE IF EXISTS organizer_quality_score CASCADE;
ALTER TABLE organizer_quality_score_new RENAME TO organizer_quality_score;

-- =============================================
-- MIGRATE ORGANIZER_VERIFICATION
-- =============================================

-- Drop old organizer_verification table (we created new one in V25 already linked to organizer)
-- Just ensure it's correct by recreating if needed
DROP TABLE IF EXISTS organizer_verification_old CASCADE;

-- If old organizer_verification exists with user_id, we rename it as backup
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organizer_verification'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE organizer_verification RENAME TO organizer_verification_old;
        
        -- Create new one linked to organizer
        CREATE TABLE organizer_verification (
            organizer_verification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            organizer_id UUID NOT NULL UNIQUE REFERENCES organizer(organizer_id),
            id_verification_status verification_status,
            verification_provider VARCHAR(100) NOT NULL DEFAULT 'Persona',
            id_verification_verified_at TIMESTAMP,
            id_verification_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT ck_organizer_verification_verified_at
                CHECK (id_verification_status = 'VERIFIED' OR id_verification_verified_at IS NULL)
        );
    END IF;
END $$;

ALTER TABLE organizer_verification
    ADD COLUMN IF NOT EXISTS verification_provider VARCHAR(100);

UPDATE organizer_verification
SET verification_provider = 'Persona'
WHERE verification_provider IS NULL;

ALTER TABLE organizer_verification
    ALTER COLUMN verification_provider SET NOT NULL;

-- =============================================
-- FIX ORGANIZER_SCORE_HISTORY IN V17
-- =============================================

-- Migrate organizer_score_history to reference organizer instead of user
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'organizer_score_history'
        AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'organizer_score_history'
            AND column_name = 'organizer_id'
        )
    ) THEN
        -- Check if current FK references user
        IF EXISTS (
            SELECT 1
            FROM information_schema.table_constraints tcns
            JOIN information_schema.constraint_column_usage ccu ON tcns.constraint_name = ccu.constraint_name
            WHERE tcns.table_name = 'organizer_score_history'
            AND ccu.column_name = 'organizer_id'
            AND tcns.constraint_type = 'FOREIGN KEY'
        ) THEN
            -- Drop old FK and add new one
            ALTER TABLE organizer_score_history
            DROP CONSTRAINT IF EXISTS organizer_score_history_organizer_id_fkey,
            ADD CONSTRAINT fk_oqs_history_organizer FOREIGN KEY (organizer_id) REFERENCES organizer(organizer_id);
        END IF;
    END IF;
END $$;

-- =============================================
-- CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_oqs_organizer ON organizer_quality_score(organizer_id);
CREATE INDEX IF NOT EXISTS idx_oqs_score ON organizer_quality_score(oqs_score DESC);
CREATE INDEX IF NOT EXISTS idx_oqs_games_hosted ON organizer_quality_score(total_games_hosted DESC);
CREATE INDEX IF NOT EXISTS idx_organizer_verification_organizer ON organizer_verification(organizer_id);

-- =============================================
-- CREATE TRIGGERS
-- =============================================

CREATE OR REPLACE TRIGGER tr_oqs_updated_at
    BEFORE UPDATE ON organizer_quality_score
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER tr_organizer_verification_updated_at
    BEFORE UPDATE ON organizer_verification
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE organizer_quality_score IS 'Organizer Quality Score (OQS) metrics per organizer (US-6.1), linked to organizer table';
COMMENT ON TABLE organizer_verification IS 'Organizer verification details linked to organizer (optional ID verification, etc.)';
