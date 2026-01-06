-- PlayLocal Database Schema V3: Sport Profile Tables
-- Implements: user_sport_profile, user_sport_position, availability windows, custom fields

-- =============================================
-- USER SPORT PROFILES
-- =============================================

CREATE TABLE user_sport_profile (
    user_sport_profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(user_id),
    sport_id UUID NOT NULL REFERENCES sport(sport_id),
    self_rated_level VARCHAR(50),  -- beginner, intermediate, advanced, competitive
    preferred_play_style VARCHAR(100),
    skill_rating FLOAT,
    skill_confidence FLOAT,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Semantic uniqueness: one profile per user per sport
    CONSTRAINT uq_user_sport UNIQUE (user_id, sport_id),
    -- Required composite uniques for FK enforcement
    CONSTRAINT uq_profile_sport UNIQUE (user_sport_profile_id, sport_id),
    CONSTRAINT uq_profile_user UNIQUE (user_sport_profile_id, user_id),
    -- Skill confidence check
    CONSTRAINT ck_skill_confidence CHECK (skill_confidence IS NULL OR (skill_confidence >= 0 AND skill_confidence <= 1))
);

-- User positions within a sport profile
CREATE TABLE user_sport_position (
    user_sport_position_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_sport_profile_id UUID NOT NULL,
    sport_id UUID NOT NULL,  -- denormalized for composite FK
    position_role_id UUID NOT NULL,
    preference_rank INT NOT NULL,
    
    -- Composite FKs ensuring sport consistency
    CONSTRAINT fk_position_profile_sport FOREIGN KEY (user_sport_profile_id, sport_id) 
        REFERENCES user_sport_profile(user_sport_profile_id, sport_id),
    CONSTRAINT fk_position_role_sport FOREIGN KEY (position_role_id, sport_id) 
        REFERENCES position_role(position_role_id, sport_id),
    
    -- Uniqueness constraints
    CONSTRAINT uq_profile_position UNIQUE (user_sport_profile_id, position_role_id),
    CONSTRAINT uq_profile_rank UNIQUE (user_sport_profile_id, preference_rank),
    -- Rank must be positive
    CONSTRAINT ck_preference_rank CHECK (preference_rank > 0)
);

-- =============================================
-- AVAILABILITY WINDOWS
-- =============================================

-- General user availability (not sport-specific)
CREATE TABLE user_availability_window (
    availability_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(user_id),
    day_of_week VARCHAR(10) NOT NULL,  -- 'monday', 'tuesday', etc.
    start_time_local TIME NOT NULL,
    end_time_local TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/Montreal',
    recurrence VARCHAR(20),  -- 'weekly', 'biweekly', etc.
    is_active BOOLEAN DEFAULT TRUE,
    
    -- End time must be after start time (unless overnight - not supported in MVP)
    CONSTRAINT ck_availability_window CHECK (end_time_local > start_time_local)
);

-- Sport-specific availability per profile
CREATE TABLE sport_availability_window (
    availability_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_sport_profile_id UUID NOT NULL REFERENCES user_sport_profile(user_sport_profile_id),
    day_of_week VARCHAR(10) NOT NULL,
    start_time_local TIME NOT NULL,
    end_time_local TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/Montreal',
    recurrence VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT ck_sport_availability_window CHECK (end_time_local > start_time_local)
);

-- =============================================
-- CUSTOM FIELDS (Split + Ownership + Typing enforced)
-- =============================================

-- Custom field definitions for user profiles
CREATE TABLE custom_field_def_user (
    custom_field_def_user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES "user"(user_id),
    key VARCHAR(100) NOT NULL,
    label VARCHAR(100),
    value_type value_type NOT NULL,
    visibility_id UUID REFERENCES content_visibility(content_visibility_id),
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- One definition per key per owner
    CONSTRAINT uq_user_field_def_key UNIQUE (owner_user_id, key),
    -- Required for composite FK with typing enforcement
    CONSTRAINT uq_user_field_def_type UNIQUE (custom_field_def_user_id, owner_user_id, value_type)
);

-- Custom field values for user profiles
CREATE TABLE custom_field_value_user (
    custom_field_value_user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_field_def_user_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES "user"(user_id),
    value_type value_type NOT NULL,  -- denormalized for composite FK
    value_text TEXT,
    value_number FLOAT,
    value_bool BOOLEAN,
    value_json JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Composite FK with type enforcement
    CONSTRAINT fk_value_user_def_type FOREIGN KEY (custom_field_def_user_id, user_id, value_type)
        REFERENCES custom_field_def_user(custom_field_def_user_id, owner_user_id, value_type),
    -- One value per field per user
    CONSTRAINT uq_user_field_value UNIQUE (custom_field_def_user_id, user_id),
    -- Exactly one value must be non-null and match type (application enforced)
    CONSTRAINT ck_single_value CHECK (
        (CASE WHEN value_text IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN value_number IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN value_bool IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN value_json IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

-- Custom field definitions for sport profiles
CREATE TABLE custom_field_def_sport (
    custom_field_def_sport_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES "user"(user_id),
    key VARCHAR(100) NOT NULL,
    label VARCHAR(100),
    value_type value_type NOT NULL,
    visibility_id UUID REFERENCES content_visibility(content_visibility_id),
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_sport_field_def_key UNIQUE (owner_user_id, key),
    CONSTRAINT uq_sport_field_def_type UNIQUE (custom_field_def_sport_id, owner_user_id, value_type)
);

-- Custom field values for sport profiles
CREATE TABLE custom_field_value_sport (
    custom_field_value_sport_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_field_def_sport_id UUID NOT NULL,
    user_sport_profile_id UUID NOT NULL,
    user_id UUID NOT NULL,  -- denormalized owner
    value_type value_type NOT NULL,
    value_text TEXT,
    value_number FLOAT,
    value_bool BOOLEAN,
    value_json JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Composite FKs
    CONSTRAINT fk_value_sport_def_type FOREIGN KEY (custom_field_def_sport_id, user_id, value_type)
        REFERENCES custom_field_def_sport(custom_field_def_sport_id, owner_user_id, value_type),
    CONSTRAINT fk_value_sport_profile FOREIGN KEY (user_sport_profile_id, user_id)
        REFERENCES user_sport_profile(user_sport_profile_id, user_id),
    -- One value per field per sport profile
    CONSTRAINT uq_sport_field_value UNIQUE (custom_field_def_sport_id, user_sport_profile_id),
    -- Single value check
    CONSTRAINT ck_sport_single_value CHECK (
        (CASE WHEN value_text IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN value_number IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN value_bool IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN value_json IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

-- Indexes
CREATE INDEX idx_user_sport_profile_user ON user_sport_profile(user_id);
CREATE INDEX idx_user_sport_profile_sport ON user_sport_profile(sport_id);
CREATE INDEX idx_user_availability_user ON user_availability_window(user_id);

-- Trigger for updated_at
CREATE TRIGGER tr_user_sport_profile_updated_at
    BEFORE UPDATE ON user_sport_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
