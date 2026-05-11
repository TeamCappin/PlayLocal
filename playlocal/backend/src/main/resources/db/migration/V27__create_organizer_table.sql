-- PlayLocal Database Schema V25: Organizer Table (Separate from User)
-- Implements: US-6.2 Task-6.2.1

-- Organizer onboarding state domain
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'organizer_status' AND n.nspname = 'public'
    ) THEN
        CREATE DOMAIN organizer_status AS VARCHAR(50)
        CHECK (VALUE IN ('NONE', 'PROVISIONAL', 'FULL'));
    END IF;
END $$;

-- =============================================
-- ORGANIZER TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS organizer (
    organizer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES "user"(user_id),
    
    -- Organizer status progression
    status organizer_status NOT NULL DEFAULT 'NONE',
    
    -- Onboarding state
    onboarding_completed_at TIMESTAMP,
    organizer_addendum_accepted_at TIMESTAMP,
    
    -- Organizer requirement verification fields
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    profile_picture_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Provisional organizer progression
    provisional_games_completed INT NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT ck_organizer_provisional_games_nonnegative
        CHECK (provisional_games_completed >= 0)
);

-- =============================================
-- ORGANIZER VERIFICATION TABLE
-- =============================================

-- V6 created organizer_verification with user_id. Drop the legacy shape so we can
-- create the organizer-linked schema in this migration.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organizer_verification'
        AND column_name = 'user_id'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organizer_verification'
        AND column_name = 'organizer_id'
    ) THEN
        DROP TABLE organizer_verification CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS organizer_verification (
    organizer_verification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL UNIQUE REFERENCES organizer(organizer_id),
    
    -- Optional ID verification fields
    id_verification_status verification_status,
    verification_provider VARCHAR(100),
    id_verification_verified_at TIMESTAMP,
    id_verification_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT ck_organizer_verification_verified_at
        CHECK (id_verification_status = 'VERIFIED' OR id_verification_verified_at IS NULL)
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_organizer_user ON organizer(user_id);
CREATE INDEX IF NOT EXISTS idx_organizer_status ON organizer(status);
CREATE INDEX IF NOT EXISTS idx_organizer_verification_organizer ON organizer_verification(organizer_id);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE OR REPLACE TRIGGER tr_organizer_updated_at
    BEFORE UPDATE ON organizer
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER tr_organizer_verification_updated_at
    BEFORE UPDATE ON organizer_verification
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ORGANIZER STATUS ENFORCEMENT FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION enforce_organizer_requirements()
RETURNS TRIGGER AS $$
BEGIN
    -- If transitioning away from NONE status, enforce all requirements
    IF NEW.status <> 'NONE' THEN
        IF NEW.organizer_addendum_accepted_at IS NULL THEN
            RAISE EXCEPTION 'Organizer status requires organizer addendum acceptance for organizer_id=%', NEW.organizer_id;
        END IF;


        IF NEW.phone_verified IS NOT TRUE THEN
            RAISE EXCEPTION 'Organizer status requires phone verification for organizer_id=%', NEW.organizer_id;
        END IF;

        IF NEW.profile_picture_verified IS NOT TRUE THEN
            RAISE EXCEPTION 'Organizer status requires profile picture verification for organizer_id=%', NEW.organizer_id;
        END IF;

        -- Check that user has at least one sport profile
        IF NOT EXISTS (
            SELECT 1
            FROM user_sport_profile usp
            WHERE usp.user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'Organizer status requires at least one user_sport_profile record for user_id=%', NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'tr_enforce_organizer_requirements'
    ) THEN
        CREATE CONSTRAINT TRIGGER tr_enforce_organizer_requirements
            AFTER INSERT OR UPDATE OF status ON organizer
            DEFERRABLE INITIALLY DEFERRED
            FOR EACH ROW
            EXECUTE FUNCTION enforce_organizer_requirements();
    END IF;
END $$;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE organizer IS 'Organizer profile and onboarding state (one-to-one with user)';
COMMENT ON COLUMN organizer.status IS 'Organizer trust progression: NONE, PROVISIONAL, FULL';
COMMENT ON COLUMN organizer.organizer_addendum_accepted_at IS 'Timestamp when organizer agreement addendum was accepted';
COMMENT ON COLUMN organizer.phone_verified IS 'True when organizer phone number has been verified';
COMMENT ON COLUMN organizer.profile_picture_verified IS 'True when organizer profile picture requirement is satisfied';
COMMENT ON COLUMN organizer.provisional_games_completed IS 'Number of completed games hosted while organizer is PROVISIONAL';

COMMENT ON TABLE organizer_verification IS 'Organizer verification details (optional ID verification, etc.)';
COMMENT ON COLUMN organizer_verification.id_verification_status IS 'Optional organizer ID verification status';
COMMENT ON COLUMN organizer_verification.id_verification_verified_at IS 'Timestamp when optional organizer ID verification is completed';
