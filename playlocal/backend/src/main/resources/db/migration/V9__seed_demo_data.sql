-- V9: Seed demo data for testing
-- Creates sample users, games, friendships, and participations

-- Insert demo users with password 'Password123!' (bcrypt hashed)
INSERT INTO "user" (user_id, email, password_hash, display_name, bio, location, default_intensity, availability, reliability_score, games_count, created_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'alex.chen@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGX7lW3DgCe.1xWfqMg9XMBqZCLe', 'Alex Chen', 'Basketball enthusiast. Looking for competitive pickup games!', 'San Francisco, CA', 'competitive', 'weekdays,evenings', 98.5, 47, NOW() - INTERVAL '6 months'),
    ('22222222-2222-2222-2222-222222222222', 'sarah.kim@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGX7lW3DgCe.1xWfqMg9XMBqZCLe', 'Sarah Kim', 'Soccer and volleyball player. Intermediate level, always down for a game!', 'San Francisco, CA', 'casual', 'weekends,afternoons', 95.0, 32, NOW() - INTERVAL '4 months'),
    ('33333333-3333-3333-3333-333333333333', 'marcus.johnson@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGX7lW3DgCe.1xWfqMg9XMBqZCLe', 'Marcus Johnson', 'Former college basketball player. Looking for high-level competition.', 'Oakland, CA', 'competitive', 'flexible', 100.0, 89, NOW() - INTERVAL '1 year'),
    ('44444444-4444-4444-4444-444444444444', 'emily.nguyen@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGX7lW3DgCe.1xWfqMg9XMBqZCLe', 'Emily Nguyen', 'Tennis and badminton lover. Beginner-friendly games preferred.', 'Berkeley, CA', 'beginner', 'weekends,mornings', 92.0, 18, NOW() - INTERVAL '2 months'),
    ('55555555-5555-5555-5555-555555555555', 'david.martinez@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGX7lW3DgCe.1xWfqMg9XMBqZCLe', 'David Martinez', 'Jack of all sports! Soccer, basketball, volleyball - I play everything.', 'San Jose, CA', 'casual', 'flexible', 88.0, 56, NOW() - INTERVAL '8 months')
ON CONFLICT (user_id) DO NOTHING;

-- Assign default 'user' role to demo users
INSERT INTO user_role (user_id, role_id)
SELECT u.user_id, r.role_id 
FROM "user" u
CROSS JOIN role r
WHERE r.name = 'user'
AND u.email LIKE '%@demo.com'
ON CONFLICT DO NOTHING;

-- Insert sample locations
INSERT INTO location (location_id, name, address_line, city, region, country, latitude, longitude)
VALUES
    ('aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Golden Gate Park Basketball Courts', '1234 JFK Drive', 'San Francisco', 'CA', 'US', 37.7694, -122.4862),
    ('aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mission Playground', '19th & Valencia', 'San Francisco', 'CA', 'US', 37.7599, -122.4214),
    ('aaaa3333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'YMCA Downtown', '220 Golden Gate Ave', 'San Francisco', 'CA', 'US', 37.7823, -122.4141),
    ('aaaa4444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dolores Park', 'Dolores St & 18th St', 'San Francisco', 'CA', 'US', 37.7596, -122.4269)
ON CONFLICT (location_id) DO NOTHING;

-- Insert sample games (mix of past, current, and future)
INSERT INTO game (game_id, created_by_user_id, sport_id, location_id, title, description, status, intensity_band, skill_band, min_players, max_players, start_time, end_time, created_at, visibility_id)
VALUES
    -- Upcoming games
    ('bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 
     (SELECT sport_id FROM sport WHERE name = 'Basketball' LIMIT 1),
     'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'Saturday 5v5 Pickup', 'Competitive 5v5 full court. Bring your A game!', 'SCHEDULED', 'competitive', 'intermediate', 8, 10,
     NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '2 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),
    
    ('bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222',
     (SELECT sport_id FROM sport WHERE name = 'Soccer' LIMIT 1),
     'aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'Sunday Soccer Friendly', 'Casual 7v7 game. All skill levels welcome!', 'SCHEDULED', 'casual', 'all_levels', 10, 14,
     NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '90 minutes', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    ('bbbb3333-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333',
     (SELECT sport_id FROM sport WHERE name = 'Basketball' LIMIT 1),
     'aaaa3333-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'YMCA Tuesday League', 'Weekly competitive game at the Y. Regular players preferred.', 'SCHEDULED', 'competitive', 'advanced', 8, 12,
     NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '2 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    ('bbbb4444-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444',
     (SELECT sport_id FROM sport WHERE name = 'Volleyball' LIMIT 1),
     'aaaa4444-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'Beach Volleyball Beginners', 'Learning to play? Join us! Patient group, no experience needed.', 'SCHEDULED', 'beginner', 'beginner', 4, 8,
     NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '2 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Past games (for history)
    ('bbbb5555-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
     (SELECT sport_id FROM sport WHERE name = 'Basketball' LIMIT 1),
     'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'Weekend Hoops Session', 'Great game last week! Team A won 42-38.', 'COMPLETED', 'competitive', 'intermediate', 8, 10,
     NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '2 hours', NOW() - INTERVAL '14 days',
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    ('bbbb6666-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333',
     (SELECT sport_id FROM sport WHERE name = 'Soccer' LIMIT 1),
     'aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'Friday Night Soccer', 'Close match! Final score 3-3.', 'COMPLETED', 'casual', 'all_levels', 10, 14,
     NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '90 minutes', NOW() - INTERVAL '10 days',
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1))
ON CONFLICT (game_id) DO NOTHING;

-- Insert game participations (rosters)
INSERT INTO game_participation (participation_id, game_id, user_id, sport_id, participation_role, join_status, attendance_status, attendance_confirmed_at, joined_at)
VALUES
    -- Saturday 5v5 participants (Basketball)
    ('cccc1111-cccc-cccc-cccc-cccccccccccc', 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'ORGANIZER', 'CONFIRMED', 'UNKNOWN', NULL, NOW()),
    ('cccc1112-cccc-cccc-cccc-cccccccccccc', 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', 'UNKNOWN', NULL, NOW()),
    ('cccc1113-cccc-cccc-cccc-cccccccccccc', 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', 'UNKNOWN', NULL, NOW()),
    
    -- Sunday Soccer participants (Soccer)
    ('cccc2221-cccc-cccc-cccc-cccccccccccc', 'bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'ORGANIZER', 'CONFIRMED', 'UNKNOWN', NULL, NOW()),
    ('cccc2222-cccc-cccc-cccc-cccccccccccc', 'bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', 'UNKNOWN', NULL, NOW()),
    ('cccc2223-cccc-cccc-cccc-cccccccccccc', 'bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', 'UNKNOWN', NULL, NOW()),
    
    -- Past game participants (Basketball)
    ('cccc5551-cccc-cccc-cccc-cccccccccccc', 'bbbb5555-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'ORGANIZER', 'CONFIRMED', 'ATTENDED', NOW(), NOW() - INTERVAL '7 days'),
    ('cccc5552-cccc-cccc-cccc-cccccccccccc', 'bbbb5555-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', 'ATTENDED', NOW(), NOW() - INTERVAL '7 days'),
    ('cccc5553-cccc-cccc-cccc-cccccccccccc', 'bbbb5555-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', 'ATTENDED', NOW(), NOW() - INTERVAL '7 days')
ON CONFLICT (participation_id) DO NOTHING;

-- Insert friendships
INSERT INTO friendship (friendship_id, requester_user_id, addressee_user_id, user_low_id, user_high_id, status, created_at, responded_at)
VALUES
    ('dddd1111-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 
     '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'ACCEPTED', NOW() - INTERVAL '5 months', NOW() - INTERVAL '5 months'),
    ('dddd2222-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333',
     '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'ACCEPTED', NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months'),
    ('dddd3333-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111',
     '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'PENDING', NOW() - INTERVAL '1 day', NULL),
    ('dddd4444-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555',
     '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'ACCEPTED', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months')
ON CONFLICT (friendship_id) DO NOTHING;

-- Insert sample notifications
INSERT INTO notification (notification_id, user_id, channel, notif_type, payload_json, sent_at, status)
VALUES
    ('eeee1111-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'IN_APP', 'game_reminder', '{"title": "Game Tomorrow!", "message": "Saturday 5v5 Pickup starts at 10am tomorrow"}', NOW(), 'SENT'),
    ('eeee2222-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'IN_APP', 'friend_request', '{"title": "New Friend Request", "message": "Emily Nguyen wants to connect with you"}', NOW() - INTERVAL '1 day', 'SENT'),
    ('eeee3333-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'IN_APP', 'game_update', '{"title": "Player Joined", "message": "Marcus Johnson joined your Saturday 5v5 Pickup game"}', NOW() - INTERVAL '2 days', 'READ'),
    ('eeee4444-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'IN_APP', 'game_reminder', '{"title": "Game This Weekend", "message": "Sunday Soccer Friendly is coming up!"}', NOW(), 'SENT'),
    ('eeee5555-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'IN_APP', 'attendance_prompt', '{"title": "Did you attend?", "message": "Please confirm your attendance for Weekend Hoops Session"}', NOW() - INTERVAL '6 days', 'SENT')
ON CONFLICT (notification_id) DO NOTHING;
