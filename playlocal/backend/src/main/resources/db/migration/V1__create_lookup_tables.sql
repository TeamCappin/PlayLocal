-- PlayLocal Database Schema V1: Lookup/Reference Tables
-- Implements: content_visibility, game_visibility, location_visibility_rule, role, sport, position_role

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUM TYPES (Domain Constraints)
-- =============================================

CREATE DOMAIN user_status AS VARCHAR(50) CHECK (VALUE IN ('ACTIVE', 'SUSPENDED', 'DELETED'));
CREATE DOMAIN game_status AS VARCHAR(50) CHECK (VALUE IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ARCHIVED'));
CREATE DOMAIN join_status AS VARCHAR(50) CHECK (VALUE IN ('CONFIRMED', 'WAITLISTED', 'REQUESTED', 'CANCELLED', 'REMOVED'));
CREATE DOMAIN attendance_status AS VARCHAR(50) CHECK (VALUE IN ('UNKNOWN', 'ATTENDED', 'NO_SHOW'));
CREATE DOMAIN participation_role AS VARCHAR(50) CHECK (VALUE IN ('ORGANIZER', 'CO_ORGANIZER', 'PARTICIPANT'));
CREATE DOMAIN friendship_status AS VARCHAR(50) CHECK (VALUE IN ('PENDING', 'ACCEPTED', 'DECLINED'));
CREATE DOMAIN report_status AS VARCHAR(50) CHECK (VALUE IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED_ACTION_TAKEN', 'RESOLVED_NO_ACTION', 'DISMISSED'));
CREATE DOMAIN report_type AS VARCHAR(50) CHECK (VALUE IN ('HARASSMENT', 'SPORTSMANSHIP', 'SAFETY', 'SPAM', 'OTHER'));
CREATE DOMAIN notification_channel AS VARCHAR(50) CHECK (VALUE IN ('IN_APP', 'EMAIL', 'PUSH'));
CREATE DOMAIN notification_status AS VARCHAR(50) CHECK (VALUE IN ('PENDING', 'SENT', 'FAILED', 'READ'));
CREATE DOMAIN media_type AS VARCHAR(50) CHECK (VALUE IN ('PHOTO', 'VIDEO'));
CREATE DOMAIN tag_type AS VARCHAR(50) CHECK (VALUE IN ('PLAYER', 'MOMENT', 'LOCATION', 'OTHER'));
CREATE DOMAIN value_type AS VARCHAR(50) CHECK (VALUE IN ('TEXT', 'NUMBER', 'BOOL', 'JSON'));
CREATE DOMAIN checkin_method AS VARCHAR(50) CHECK (VALUE IN ('MANUAL', 'GEOLOCATION', 'QR_CODE'));
CREATE DOMAIN checkin_status AS VARCHAR(50) CHECK (VALUE IN ('PENDING', 'CHECKED_IN', 'CHECKED_OUT'));
CREATE DOMAIN invite_status AS VARCHAR(50) CHECK (VALUE IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'));
CREATE DOMAIN balance_mode AS VARCHAR(50) CHECK (VALUE IN ('RANDOM', 'CAPTAINS_PICK', 'SMART_BALANCE', 'MANUAL'));
CREATE DOMAIN verification_status AS VARCHAR(50) CHECK (VALUE IN ('PENDING', 'VERIFIED', 'REJECTED'));
CREATE DOMAIN audit_action_type AS VARCHAR(50) CHECK (VALUE IN (
    'USER_CREATED', 'USER_UPDATED', 'USER_SUSPENDED', 'USER_DELETED', 'USER_RESTORED',
    'GAME_CREATED', 'GAME_UPDATED', 'GAME_CANCELLED',
    'REPORT_CREATED', 'REPORT_RESOLVED',
    'BLOCK_CREATED', 'BLOCK_REMOVED',
    'ROLE_GRANTED', 'ROLE_REVOKED',
    'MODERATION_ACTION'
));
CREATE DOMAIN target_type AS VARCHAR(50) CHECK (VALUE IN ('USER', 'GAME', 'REPORT', 'MEDIA', 'MATCH_RECORD'));

-- =============================================
-- LOOKUP/REFERENCE TABLES
-- =============================================

-- Content visibility options
CREATE TABLE content_visibility (
    content_visibility_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    CONSTRAINT uq_content_visibility_code UNIQUE (code)
);

-- Seed default visibility options
INSERT INTO content_visibility (code, description) VALUES
    ('private', 'Visible only to the owner'),
    ('friends', 'Visible to friends only'),
    ('participants', 'Visible to game participants only'),
    ('public', 'Visible to all authenticated users');

-- Game visibility options
CREATE TABLE game_visibility (
    game_visibility_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    CONSTRAINT uq_game_visibility_code UNIQUE (code)
);

INSERT INTO game_visibility (code, description) VALUES
    ('private', 'Invite only'),
    ('friends', 'Visible to friends'),
    ('public', 'Visible to all authenticated users');

-- Location visibility rules
CREATE TABLE location_visibility_rule (
    location_visibility_rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    CONSTRAINT uq_location_visibility_rule_code UNIQUE (code)
);

INSERT INTO location_visibility_rule (code, description) VALUES
    ('always_visible', 'Exact location always visible'),
    ('confirmed_only', 'Exact location visible to confirmed participants only'),
    ('approximate', 'Only approximate location shown until confirmed'),
    ('hidden', 'Location hidden until game starts');

-- Roles for RBAC
CREATE TABLE role (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    CONSTRAINT uq_role_name UNIQUE (name)
);

INSERT INTO role (name, description) VALUES
    ('user', 'Standard authenticated user'),
    ('moderator', 'Can review reports and take moderation actions'),
    ('admin', 'Full administrative access');

-- Sports reference table
CREATE TABLE sport (
    sport_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    supports_positions BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed common sports
INSERT INTO sport (name, category, supports_positions) VALUES
    ('Basketball', 'Team Sports', TRUE),
    ('Soccer', 'Team Sports', TRUE),
    ('Volleyball', 'Team Sports', TRUE),
    ('Tennis', 'Racquet Sports', FALSE),
    ('Badminton', 'Racquet Sports', FALSE),
    ('Ultimate Frisbee', 'Team Sports', TRUE),
    ('Flag Football', 'Team Sports', TRUE),
    ('Softball', 'Team Sports', TRUE),
    ('Baseball', 'Team Sports', TRUE),
    ('Pickleball', 'Racquet Sports', FALSE),
    ('Hockey', 'Team Sports', TRUE);

-- Position roles per sport
CREATE TABLE position_role (
    position_role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id UUID NOT NULL REFERENCES sport(sport_id),
    name VARCHAR(100) NOT NULL,
    -- Powers composite FK (position_role_id, sport_id)
    CONSTRAINT uq_position_role_sport UNIQUE (position_role_id, sport_id)
);

-- Seed sample positions
INSERT INTO position_role (sport_id, name) 
SELECT s.sport_id, p.name
FROM sport s
CROSS JOIN (VALUES 
    ('Point Guard'), ('Shooting Guard'), ('Small Forward'), ('Power Forward'), ('Center')
) AS p(name)
WHERE s.name = 'Basketball';

INSERT INTO position_role (sport_id, name) 
SELECT s.sport_id, p.name
FROM sport s
CROSS JOIN (VALUES 
    ('Goalkeeper'), ('Defender'), ('Midfielder'), ('Forward')
) AS p(name)
WHERE s.name = 'Soccer';

INSERT INTO position_role (sport_id, name) 
SELECT s.sport_id, p.name
FROM sport s
CROSS JOIN (VALUES 
    ('Setter'), ('Outside Hitter'), ('Middle Blocker'), ('Libero'), ('Opposite')
) AS p(name)
WHERE s.name = 'Volleyball';

-- Policy documents for EULA/consent tracking
CREATE TABLE policy_document (
    policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_type VARCHAR(50) NOT NULL,  -- e.g., 'eula', 'privacy_policy', 'code_of_conduct'
    version VARCHAR(20) NOT NULL,
    content_hash VARCHAR(64),  -- SHA-256 hash of content
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial EULA
INSERT INTO policy_document (doc_type, version, content_hash) VALUES
    ('eula', '1.0', 'initial_hash_placeholder'),
    ('privacy_policy', '1.0', 'initial_hash_placeholder'),
    ('code_of_conduct', '1.0', 'initial_hash_placeholder');
