-- V9: Seed demo data for development and testing ONLY
-- SECURITY NOTE: Demo passwords for local dev. NOT used in production.

-- San Francisco demo users (password: password123)
-- NOSONAR: Intentional demo credentials for local development only
INSERT INTO "user" (user_id, email, password_hash, display_name, bio, location, default_intensity, availability, reliability_score, games_count, created_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'alex.chen@demo.com', '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq', 'Alex Chen', 'Basketball enthusiast.', 'San Francisco, CA', 'competitive', 'weekdays,evenings', 98.5, 47, NOW() - INTERVAL '6 months'),
    ('22222222-2222-2222-2222-222222222222', 'sarah.kim@demo.com', '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq', 'Sarah Kim', 'Soccer and volleyball player.', 'San Francisco, CA', 'casual', 'weekends,afternoons', 95.0, 32, NOW() - INTERVAL '4 months'),
    ('33333333-3333-3333-3333-333333333333', 'marcus.johnson@demo.com', '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq', 'Marcus Johnson', 'Former college basketball player.', 'Oakland, CA', 'competitive', 'flexible', 100.0, 89, NOW() - INTERVAL '1 year'),
    ('44444444-4444-4444-4444-444444444444', 'emily.nguyen@demo.com', '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq', 'Emily Nguyen', 'Tennis and badminton lover.', 'Berkeley, CA', 'beginner', 'weekends,mornings', 92.0, 18, NOW() - INTERVAL '2 months'),
    ('55555555-5555-5555-5555-555555555555', 'david.martinez@demo.com', '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq', 'David Martinez', 'Jack of all sports!', 'San Jose, CA', 'casual', 'flexible', 88.0, 56, NOW() - INTERVAL '8 months')
ON CONFLICT (user_id) DO NOTHING;

-- Assign user roles
INSERT INTO user_role (user_id, role_id) SELECT u.user_id, r.role_id FROM "user" u CROSS JOIN role r WHERE r.name = 'user' AND u.email LIKE '%@demo.com' ON CONFLICT DO NOTHING;

-- Locations
INSERT INTO location (location_id, name, address_line, city, region, country, latitude, longitude) VALUES
    ('aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Golden Gate Park Courts', '1234 JFK Drive', 'San Francisco', 'CA', 'US', 37.7694, -122.4862),
    ('aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mission Playground', '19th & Valencia', 'San Francisco', 'CA', 'US', 37.7599, -122.4214),
    ('aaaa3333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'YMCA Downtown', '220 Golden Gate Ave', 'San Francisco', 'CA', 'US', 37.7823, -122.4141),
    ('aaaa4444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dolores Park', 'Dolores St & 18th St', 'San Francisco', 'CA', 'US', 37.7596, -122.4269)
ON CONFLICT (location_id) DO NOTHING;

-- Games
INSERT INTO game (game_id, created_by_user_id, sport_id, location_id, title, description, status, intensity_band, skill_band, min_players, max_players, start_time, end_time, created_at, visibility_id) VALUES
    ('bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name = 'Basketball' LIMIT 1), 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Saturday 5v5 Pickup', 'Competitive 5v5 full court.', 'SCHEDULED', 'competitive', 'intermediate', 8, 10, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 2 hours', NOW(), (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),
    ('bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name = 'Soccer' LIMIT 1), 'aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sunday Soccer Friendly', 'Casual 7v7 game.', 'SCHEDULED', 'casual', 'all_levels', 10, 14, NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 90 minutes', NOW(), (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),
    ('bbbb3333-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name = 'Basketball' LIMIT 1), 'aaaa3333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Wednesday Night Hoops', 'Indoor 3v3. All levels.', 'SCHEDULED', 'casual', 'all_levels', 6, 12, NOW() + INTERVAL '4 days', NOW() + INTERVAL '4 days 2 hours', NOW(), (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),
    ('bbbb4444-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name = 'Volleyball' LIMIT 1), 'aaaa4444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Beach Volleyball Beginners', 'Beginner-friendly!', 'SCHEDULED', 'beginner', 'beginner', 4, 8, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 2 hours', NOW(), (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1))
ON CONFLICT (game_id) DO NOTHING;

-- Participations
INSERT INTO game_participation (participation_id, game_id, user_id, sport_id, participation_role, join_status, joined_at, waitlist_position) VALUES
    ('cccc1111-cccc-cccc-cccc-cccccccccccc', 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name = 'Basketball' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('cccc2222-cccc-cccc-cccc-cccccccccccc', 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name = 'Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('cccc3333-cccc-cccc-cccc-cccccccccccc', 'bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name = 'Soccer' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('cccc4444-cccc-cccc-cccc-cccccccccccc', 'bbbb3333-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name = 'Basketball' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('cccc5555-cccc-cccc-cccc-cccccccccccc', 'bbbb4444-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name = 'Volleyball' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL)
ON CONFLICT (participation_id) DO NOTHING;

-- Friendships
INSERT INTO friendship (friendship_id, requester_user_id, addressee_user_id, user_low_id, user_high_id, status, created_at, responded_at) VALUES
    ('dddd1111-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 
     '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'ACCEPTED', NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months'),
    ('dddd2222-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222',
     '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'ACCEPTED', NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month')
ON CONFLICT (friendship_id) DO NOTHING;
