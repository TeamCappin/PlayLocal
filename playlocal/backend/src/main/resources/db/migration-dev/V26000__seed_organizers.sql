-- PlayLocal Database Migration Dev: V260 - Seed 3 Organizers
-- Creates 3 real organizer users with complete onboarding state

-- =============================================
-- CREATE 3 TEST ORGANIZER USERS
-- =============================================

INSERT INTO "user" (user_id, email, password_hash, display_name, slug, avatar_url, phone_e164, status, reliability_score, attended_count, no_show_count, games_count, created_at, updated_at, age_confirmed_at, mfa_enabled)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'org1@playlocal.test', 'hash_org1', 'Alex Organizer', 'alex-organizer', 'https://example.com/avatar1.jpg', '+14165551001', 'ACTIVE', 95.0, 10, 1, 12, NOW() - INTERVAL '6 months', NOW(), NOW(), false),
    ('a0000000-0000-0000-0000-000000000002', 'org2@playlocal.test', 'hash_org2', 'Jordan Host', 'jordan-host', 'https://example.com/avatar2.jpg', '+14165551002', 'ACTIVE', 98.0, 15, 0, 18, NOW() - INTERVAL '5 months', NOW(), NOW(), false),
    ('a0000000-0000-0000-0000-000000000003', 'org3@playlocal.test', 'hash_org3', 'Casey Events', 'casey-events', 'https://example.com/avatar3.jpg', '+14165551003', 'ACTIVE', 92.0, 8, 2, 10, NOW() - INTERVAL '4 months', NOW(), NOW(), false)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- CREATE SPORTS PROFILES FOR ORGANIZERS
-- =============================================

-- Get sport IDs (assuming basketball and soccer exist from seed)
INSERT INTO user_sport_profile (user_sport_profile_id, user_id, sport_id, self_rated_level, preferred_play_style, skill_rating, skill_confidence, is_visible, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    u.user_id,
    s.sport_id,
    'competitive',
    'aggressive',
    1600.0,
    0.85,
    true,
    NOW(),
    NOW()
FROM "user" u
CROSS JOIN sport s
WHERE u.user_id IN ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003')
  AND s.name IN ('Basketball', 'Soccer')
ON CONFLICT DO NOTHING;

-- =============================================
-- CREATE ORGANIZER RECORDS
-- =============================================

INSERT INTO organizer (organizer_id, user_id, status, onboarding_completed_at, organizer_addendum_accepted_at, phone_verified, profile_picture_verified, safety_acknowledgement_1_checked, safety_acknowledgement_2_checked, provisional_games_completed, created_at, updated_at)
VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'PROVISIONAL',
        NOW() - INTERVAL '5 months',
        NOW() - INTERVAL '5 months',
        true,
        true,
        true,
        true,
        1,
        NOW() - INTERVAL '5 months',
        NOW()
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000002',
        'FULL',
        NOW() - INTERVAL '4 months',
        NOW() - INTERVAL '4 months',
        true,
        true,
        true,
        true,
        2,
        NOW() - INTERVAL '4 months',
        NOW()
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000003',
        'PROVISIONAL',
        NOW() - INTERVAL '3 months',
        NOW() - INTERVAL '3 months',
        true,
        true,
        true,
        true,
        0,
        NOW() - INTERVAL '3 months',
        NOW()
    )
ON CONFLICT DO NOTHING;

-- =============================================
-- CREATE ORGANIZER VERIFICATION RECORDS (OPTIONAL)
-- =============================================

INSERT INTO organizer_verification (organizer_verification_id, organizer_id, id_verification_status, verification_provider, id_verification_verified_at, id_verification_notes, created_at, updated_at)
VALUES
    (
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'VERIFIED',
        'Persona',
        NOW() - INTERVAL '5 months',
        'Verified via Persona on 2025-10-01',
        NOW() - INTERVAL '5 months',
        NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000002',
        'VERIFIED',
        'Persona',
        NOW() - INTERVAL '4 months',
        'Verified via Persona on 2025-11-01',
        NOW() - INTERVAL '4 months',
        NOW()
    ),
    (
        'c0000000-0000-0000-0000-000000000003',
        'b0000000-0000-0000-0000-000000000003',
        'PENDING',
        'Persona',
        NULL,
        'Pending ID verification',
        NOW() - INTERVAL '3 months',
        NOW()
    )
ON CONFLICT DO NOTHING;

-- =============================================
-- CREATE ORGANIZER QUALITY SCORE RECORDS
-- =============================================

INSERT INTO organizer_quality_score (organizer_id, oqs_score, game_completion_rate, repeat_player_rate, total_games_hosted, completed_games, cancelled_games, total_unique_players, repeat_players, last_calculated_at, created_at, updated_at)
VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        90.0,
        100.0,
        80.0,
        1,
        1,
        0,
        8,
        2,
        NOW() - INTERVAL '5 months',
        NOW() - INTERVAL '5 months',
        NOW()
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        97.5,
        100.0,
        90.0,
        2,
        2,
        0,
        15,
        6,
        NOW() - INTERVAL '4 months',
        NOW() - INTERVAL '4 months',
        NOW()
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        100.0,
        0.0,
        0.0,
        0,
        0,
        0,
        0,
        0,
        NOW() - INTERVAL '3 months',
        NOW() - INTERVAL '3 months',
        NOW()
    )
ON CONFLICT DO NOTHING;
