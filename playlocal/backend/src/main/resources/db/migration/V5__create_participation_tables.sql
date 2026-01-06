-- PlayLocal Database Schema V5: Participation & Team Tables
-- Implements: team, game_participation, game_participation_event, checkin, game_invite
-- CRITICAL: Concurrency-safe joins with proper constraints

-- =============================================
-- TEAMS
-- =============================================

CREATE TABLE team (
    team_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES game(game_id),
    name VARCHAR(100),
    captain_participation_id UUID,  -- forward reference, FK added after game_participation
    captain_team_id UUID,
    
    -- Required composite unique for cross-game safety
    CONSTRAINT uq_game_team UNIQUE (game_id, team_id),
    
    -- Captain null-safety: both null or both non-null
    CONSTRAINT ck_captain_null_safety CHECK (
        (captain_participation_id IS NULL) = (captain_team_id IS NULL)
    ),
    -- Captain team must be this team
    CONSTRAINT ck_captain_same_team CHECK (
        captain_team_id IS NULL OR captain_team_id = team_id
    )
);

-- =============================================
-- GAME PARTICIPATION (CRITICAL: Concurrency-safe)
-- =============================================

CREATE TABLE game_participation (
    participation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES game(game_id),
    user_id UUID NOT NULL REFERENCES "user"(user_id),
    sport_id UUID NOT NULL,  -- denormalized for composite FK
    
    -- Role and status
    participation_role participation_role NOT NULL DEFAULT 'PARTICIPANT',
    join_status join_status NOT NULL DEFAULT 'CONFIRMED',
    waitlist_position INT,  -- only for waitlisted status
    
    -- Position preference (optional)
    requested_position_role_id UUID,
    
    -- Team assignment (null until assigned)
    team_id UUID,
    
    -- Attendance tracking (Core reliability loop)
    attendance_status attendance_status NOT NULL DEFAULT 'UNKNOWN',
    attendance_confirmed_by_user_id UUID REFERENCES "user"(user_id),
    attendance_confirmed_at TIMESTAMP,
    
    -- Timestamps
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    notes TEXT,
    
    -- CRITICAL: One participation per user per game (prevents double-booking)
    CONSTRAINT uq_game_user UNIQUE (game_id, user_id),
    
    -- Required composite uniques for FK enforcement
    CONSTRAINT uq_game_participation UNIQUE (game_id, participation_id),
    CONSTRAINT uq_game_participation_team UNIQUE (game_id, participation_id, team_id),
    
    -- Sport consistency: game must be for this sport
    CONSTRAINT fk_participation_game_sport FOREIGN KEY (game_id, sport_id) 
        REFERENCES game(game_id, sport_id),
    
    -- Position role must match sport
    CONSTRAINT fk_participation_position_sport FOREIGN KEY (requested_position_role_id, sport_id)
        REFERENCES position_role(position_role_id, sport_id),
    
    -- Cross-game safety: team must belong to this game
    CONSTRAINT fk_participation_team FOREIGN KEY (game_id, team_id)
        REFERENCES team(game_id, team_id),
    
    -- Participation legality checks (from DBML Global Note #5)
    CONSTRAINT ck_waitlist_team CHECK (
        join_status NOT IN ('WAITLISTED', 'REQUESTED', 'CANCELLED', 'REMOVED') OR team_id IS NULL
    ),
    CONSTRAINT ck_waitlist_position CHECK (
        (join_status = 'WAITLISTED') = (waitlist_position IS NOT NULL)
    ),
    CONSTRAINT ck_waitlist_position_positive CHECK (
        waitlist_position IS NULL OR waitlist_position > 0
    ),
    CONSTRAINT ck_left_status CHECK (
        join_status NOT IN ('CANCELLED', 'REMOVED') OR left_at IS NOT NULL
    ),
    CONSTRAINT ck_attendance_confirmed CHECK (
        attendance_status = 'UNKNOWN' OR attendance_confirmed_at IS NOT NULL
    )
);

-- CRITICAL: Partial unique index for waitlist position (Postgres)
-- Ensures no duplicate waitlist positions within a game for waitlisted participants
CREATE UNIQUE INDEX ux_waitlist_position ON game_participation(game_id, waitlist_position) 
    WHERE join_status = 'WAITLISTED';

-- Now add the captain FK to team (circular reference resolved)
ALTER TABLE team ADD CONSTRAINT fk_team_captain 
    FOREIGN KEY (game_id, captain_participation_id, captain_team_id) 
    REFERENCES game_participation(game_id, participation_id, team_id);

-- Indexes for common queries
CREATE INDEX idx_participation_game ON game_participation(game_id);
CREATE INDEX idx_participation_user ON game_participation(user_id);
CREATE INDEX idx_participation_status ON game_participation(join_status);
CREATE INDEX idx_participation_attendance ON game_participation(attendance_status);

-- =============================================
-- PARTICIPATION EVENTS (audit trail)
-- =============================================

CREATE TABLE game_participation_event (
    participation_event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL,
    participation_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,  -- 'joined', 'left', 'waitlisted', 'promoted', 'removed', 'attendance_confirmed'
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actor_user_id UUID REFERENCES "user"(user_id),
    metadata_json JSONB,
    
    -- Composite FK to prevent drift
    CONSTRAINT fk_event_participation FOREIGN KEY (game_id, participation_id)
        REFERENCES game_participation(game_id, participation_id)
);

CREATE INDEX idx_participation_event_game ON game_participation_event(game_id);
CREATE INDEX idx_participation_event_participation ON game_participation_event(participation_id);

-- =============================================
-- CHECK-IN STATE & EVENTS
-- =============================================

CREATE TABLE checkin_state (
    participation_id UUID PRIMARY KEY REFERENCES game_participation(participation_id),
    first_checked_in_at TIMESTAMP,
    last_checked_in_at TIMESTAMP,
    last_method checkin_method,
    status checkin_status NOT NULL DEFAULT 'PENDING',
    last_metadata_json JSONB
);

CREATE TABLE checkin_event (
    checkin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participation_id UUID NOT NULL REFERENCES game_participation(participation_id),
    checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    method checkin_method NOT NULL,
    metadata_json JSONB
);

-- =============================================
-- GAME INVITES
-- =============================================

CREATE TABLE game_invite (
    invite_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES game(game_id),
    invited_user_id UUID NOT NULL REFERENCES "user"(user_id),
    invited_by_user_id UUID NOT NULL REFERENCES "user"(user_id),
    status invite_status NOT NULL DEFAULT 'PENDING',
    token VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    
    CONSTRAINT uq_invite_token UNIQUE (token)
);

CREATE INDEX idx_game_invite_game ON game_invite(game_id);
CREATE INDEX idx_game_invite_invitee ON game_invite(invited_user_id);
