-- V12__create_endorsement_table.sql
-- Create endorsement table for Organizer Endorsements (US 3.3)

CREATE TABLE endorsement (
    endorsement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endorser_user_id UUID NOT NULL REFERENCES "user"(user_id),
    endorsed_user_id UUID NOT NULL REFERENCES "user"(user_id),
    game_id UUID NOT NULL REFERENCES game(game_id),
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Ensure an organizer can only endorse a specific player once per game
    CONSTRAINT uq_endorsement_game_users UNIQUE (endorser_user_id, endorsed_user_id, game_id)
);

-- Index for creating the "My Endorsements" profile view efficiently
CREATE INDEX idx_endorsement_endorsed_user ON endorsement(endorsed_user_id);

-- Index just in case we need to show "Endorsements given by X"
CREATE INDEX idx_endorsement_endorser ON endorsement(endorser_user_id);
