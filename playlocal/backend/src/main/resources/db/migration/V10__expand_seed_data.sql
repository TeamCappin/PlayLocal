-- V10: Expand seed data for full UI coverage
-- Adds Montreal locations, games for all 11 sports, and rich rosters

-- Additional demo users for fuller rosters
INSERT INTO "user" (user_id, email, password_hash, display_name, bio, location, default_intensity, availability, reliability_score, games_count, created_at)
VALUES 
    ('66666666-6666-6666-6666-666666666666', 'minh.h@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGX7lW3DgCe.1xWfqMg9XMBqZCLe', 'Minh H.', 'Basketball enthusiast from Montreal!', 'Montreal, QC', 'competitive', 'weekends', 98.0, 42, NOW() - INTERVAL '5 months'),
    ('77777777-7777-7777-7777-777777777777', 'omar.e@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGX7lW3DgCe.1xWfqMg9XMBqZCLe', 'Omar E.', 'Volleyball player. Beach or indoor!', 'Montreal, QC', 'competitive', 'flexible', 92.0, 28, NOW() - INTERVAL '4 months'),
    ('88888888-8888-8888-8888-888888888888', 'melissa.r@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGX7lW3DgCe.1xWfqMg9XMBqZCLe', 'Melissa R.', 'Tennis doubles partner looking for games.', 'Montreal, QC', 'casual', 'weekends', 97.0, 35, NOW() - INTERVAL '6 months'),
    ('99999999-9999-9999-9999-999999999999', 'younes.b@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGX7lW3DgCe.1xWfqMg9XMBqZCLe', 'Younes B.', 'Badminton and squash player.', 'Montreal, QC', 'casual', 'evenings', 94.0, 22, NOW() - INTERVAL '3 months'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alex.g@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGX7lW3DgCe.1xWfqMg9XMBqZCLe', 'Alex G.', 'Ultimate frisbee captain. Spirit of the game!', 'Montreal, QC', 'competitive', 'flexible', 96.0, 51, NOW() - INTERVAL '8 months'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'david.o@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGX7lW3DgCe.1xWfqMg9XMBqZCLe', 'David O.', 'Flag football and softball. Weekend warrior!', 'Montreal, QC', 'competitive', 'weekends', 91.0, 38, NOW() - INTERVAL '7 months'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'steven.z@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGX7lW3DgCe.1xWfqMg9XMBqZCLe', 'Steven Z.', 'All sports! Basketball, soccer, softball.', 'Montreal, QC', 'casual', 'flexible', 93.0, 45, NOW() - INTERVAL '9 months'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'youssef.y@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGX7lW3DgCe.1xWfqMg9XMBqZCLe', 'Youssef Y.', 'Baseball and hockey fan.', 'Montreal, QC', 'competitive', 'evenings', 89.0, 31, NOW() - INTERVAL '4 months'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'hudson.l@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGX7lW3DgCe.1xWfqMg9XMBqZCLe', 'Hudson L.', 'Pickleball convert! Learning the game.', 'Montreal, QC', 'beginner', 'weekends', 88.0, 12, NOW() - INTERVAL '2 months'),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'allaye.d@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGX7lW3DgCe.1xWfqMg9XMBqZCLe', 'Allaye D.', 'Hockey goalie. Full gear ready!', 'Montreal, QC', 'competitive', 'evenings', 99.0, 67, NOW() - INTERVAL '1 year')
ON CONFLICT (user_id) DO NOTHING;

-- Assign default 'user' role to new demo users
INSERT INTO user_role (user_id, role_id)
SELECT u.user_id, r.role_id 
FROM "user" u
CROSS JOIN role r
WHERE r.name = 'user'
AND u.email LIKE '%@demo.com'
ON CONFLICT DO NOTHING;

-- Montreal-based locations
INSERT INTO location (location_id, name, address_line, city, region, country, latitude, longitude)
VALUES
    ('loc11111-1111-1111-1111-111111111111', 'Parc Jarry Courts', '201 Rue Gary-Carter', 'Montreal', 'QC', 'CA', 45.5312, -73.6205),
    ('loc22222-2222-2222-2222-222222222222', 'Complexe Claude-Robillard', '1000 Émile-Journault', 'Montreal', 'QC', 'CA', 45.5401, -73.6241),
    ('loc33333-3333-3333-3333-333333333333', 'Parc Jean-Drapeau Beach', 'Île Sainte-Hélène', 'Montreal', 'QC', 'CA', 45.5088, -73.5340),
    ('loc44444-4444-4444-4444-444444444444', 'Parc Lafontaine Tennis', 'Avenue du Parc Lafontaine', 'Montreal', 'QC', 'CA', 45.5256, -73.5698),
    ('loc55555-5555-5555-5555-555555555555', 'Centre sportif Côte-des-Neiges', '4880 Avenue Van Horne', 'Montreal', 'QC', 'CA', 45.4920, -73.6241),
    ('loc66666-6666-6666-6666-666666666666', 'Parc Maisonneuve', '4601 Rue Sherbrooke E', 'Montreal', 'QC', 'CA', 45.5569, -73.5497),
    ('loc77777-7777-7777-7777-777777777777', 'McGill Stadium', '475 Avenue des Pins O', 'Montreal', 'QC', 'CA', 45.5087, -73.5816),
    ('loc88888-8888-8888-8888-888888888888', 'Parc Jeanne-Mance', 'Avenue du Mont-Royal', 'Montreal', 'QC', 'CA', 45.5163, -73.5854),
    ('loc99999-9999-9999-9999-999999999999', 'Gary Carter Memorial Field', 'Parc Jarry', 'Montreal', 'QC', 'CA', 45.5325, -73.6180),
    ('locaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'YMCA du Parc', '5550 Avenue du Parc', 'Montreal', 'QC', 'CA', 45.5214, -73.6058),
    ('locbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Aréna Mont-Royal', '1000 Avenue du Mont-Royal E', 'Montreal', 'QC', 'CA', 45.5271, -73.5720)
ON CONFLICT (location_id) DO NOTHING;

-- Games for all 11 sports
INSERT INTO game (game_id, created_by_user_id, sport_id, location_id, title, description, status, intensity_band, skill_band, min_players, max_players, start_time, end_time, created_at, visibility_id)
VALUES
    -- Basketball
    ('game1111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 
     (SELECT sport_id FROM sport WHERE name = 'Basketball' LIMIT 1),
     'loc11111-1111-1111-1111-111111111111',
     '5v5 Basketball Pickup', 'Competitive 5v5 full court. Bring your A game!', 'SCHEDULED', 'competitive', 'intermediate', 6, 10,
     NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '2 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),
    
    -- Soccer
    ('game2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
     (SELECT sport_id FROM sport WHERE name = 'Soccer' LIMIT 1),
     'loc22222-2222-2222-2222-222222222222',
     'Sunday Soccer Friendly', 'Casual 11v11 game. All levels welcome!', 'SCHEDULED', 'casual', 'all_levels', 14, 22,
     NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '90 minutes', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Volleyball
    ('game3333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777',
     (SELECT sport_id FROM sport WHERE name = 'Volleyball' LIMIT 1),
     'loc33333-3333-3333-3333-333333333333',
     'Beach Volleyball Tournament', '6v6 beach volleyball. Bring sunscreen!', 'SCHEDULED', 'competitive', 'intermediate', 8, 12,
     NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '3 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Tennis
    ('game4444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888',
     (SELECT sport_id FROM sport WHERE name = 'Tennis' LIMIT 1),
     'loc44444-4444-4444-4444-444444444444',
     'Tennis Doubles Match', 'Looking for 1 more for doubles!', 'SCHEDULED', 'competitive', 'intermediate', 4, 4,
     NOW() + INTERVAL '4 days', NOW() + INTERVAL '4 days' + INTERVAL '90 minutes', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Badminton
    ('game5555-5555-5555-5555-555555555555', '99999999-9999-9999-9999-999999999999',
     (SELECT sport_id FROM sport WHERE name = 'Badminton' LIMIT 1),
     'loc55555-5555-5555-5555-555555555555',
     'Badminton Drop-In', 'Casual badminton. Beginners welcome!', 'SCHEDULED', 'casual', 'all_levels', 4, 8,
     NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '2 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Ultimate Frisbee
    ('game6666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     (SELECT sport_id FROM sport WHERE name = 'Ultimate Frisbee' LIMIT 1),
     'loc66666-6666-6666-6666-666666666666',
     'Ultimate Frisbee Pickup', '7v7 ultimate. Spirit of the game!', 'SCHEDULED', 'competitive', 'intermediate', 10, 14,
     NOW() + INTERVAL '2 days' + INTERVAL '1 hour', NOW() + INTERVAL '2 days' + INTERVAL '2.5 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Flag Football
    ('game7777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     (SELECT sport_id FROM sport WHERE name = 'Flag Football' LIMIT 1),
     'loc77777-7777-7777-7777-777777777777',
     'Flag Football League Game', '7v7 flag football. No tackle!', 'SCHEDULED', 'competitive', 'intermediate', 10, 14,
     NOW() + INTERVAL '6 days', NOW() + INTERVAL '6 days' + INTERVAL '90 minutes', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Softball
    ('game8888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
     (SELECT sport_id FROM sport WHERE name = 'Softball' LIMIT 1),
     'loc88888-8888-8888-8888-888888888888',
     'Softball Sunday', 'Friendly co-ed softball game.', 'SCHEDULED', 'casual', 'all_levels', 12, 18,
     NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Baseball
    ('game9999-9999-9999-9999-999999999999', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
     (SELECT sport_id FROM sport WHERE name = 'Baseball' LIMIT 1),
     'loc99999-9999-9999-9999-999999999999',
     'Baseball Diamond Practice', '9-inning practice game.', 'SCHEDULED', 'competitive', 'intermediate', 10, 18,
     NOW() + INTERVAL '4 days' + INTERVAL '2 hours', NOW() + INTERVAL '4 days' + INTERVAL '4 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Pickleball
    ('gameaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
     (SELECT sport_id FROM sport WHERE name = 'Pickleball' LIMIT 1),
     'locaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'Pickleball Beginner Session', 'Learn pickleball! Equipment provided.', 'SCHEDULED', 'beginner', 'beginner', 4, 8,
     NOW() + INTERVAL '1 day' + INTERVAL '1 hour', NOW() + INTERVAL '1 day' + INTERVAL '2.5 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Hockey
    ('gamebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ffffffff-ffff-ffff-ffff-ffffffffffff',
     (SELECT sport_id FROM sport WHERE name = 'Hockey' LIMIT 1),
     'locbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     'Hockey Shinny Night', 'Drop-in hockey. Full gear required.', 'SCHEDULED', 'competitive', 'intermediate', 12, 20,
     NOW() + INTERVAL '5 days' + INTERVAL '1 hour', NOW() + INTERVAL '5 days' + INTERVAL '2.5 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1))
ON CONFLICT (game_id) DO NOTHING;

-- Rich rosters for the games
INSERT INTO game_participation (participation_id, game_id, user_id, sport_id, participation_role, join_status, joined_at, waitlist_position)
VALUES
    -- Basketball game (8 confirmed + 2 waitlisted)
    ('part1111-1111-1111-1111-111111111111', 'game1111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('part1112-1111-1111-1111-111111111111', 'game1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part1113-1111-1111-1111-111111111111', 'game1111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part1114-1111-1111-1111-111111111111', 'game1111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part1115-1111-1111-1111-111111111111', 'game1111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part1116-1111-1111-1111-111111111111', 'game1111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part1117-1111-1111-1111-111111111111', 'game1111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part1118-1111-1111-1111-111111111111', 'game1111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part1119-1111-1111-1111-111111111111', 'game1111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'WAITLISTED', NOW(), 1),
    ('part111a-1111-1111-1111-111111111111', 'game1111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'WAITLISTED', NOW(), 2),
    
    -- Soccer game (10 confirmed)
    ('part2221-2222-2222-2222-222222222222', 'game2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('part2222-2222-2222-2222-222222222222', 'game2222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part2223-2222-2222-2222-222222222222', 'game2222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part2224-2222-2222-2222-222222222222', 'game2222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part2225-2222-2222-2222-222222222222', 'game2222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part2226-2222-2222-2222-222222222222', 'game2222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part2227-2222-2222-2222-222222222222', 'game2222-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part2228-2222-2222-2222-222222222222', 'game2222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part2229-2222-2222-2222-222222222222', 'game2222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part222a-2222-2222-2222-222222222222', 'game2222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),

    -- Volleyball game (6 confirmed + 2 waitlisted)
    ('part3331-3333-3333-3333-333333333333', 'game3333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('part3332-3333-3333-3333-333333333333', 'game3333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part3333-3333-3333-3333-333333333333', 'game3333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part3334-3333-3333-3333-333333333333', 'game3333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part3335-3333-3333-3333-333333333333', 'game3333-3333-3333-3333-333333333333', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part3336-3333-3333-3333-333333333333', 'game3333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part3337-3333-3333-3333-333333333333', 'game3333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT', 'WAITLISTED', NOW(), 1),
    ('part3338-3333-3333-3333-333333333333', 'game3333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT', 'WAITLISTED', NOW(), 2),

    -- Tennis game (3 confirmed - needs 1 more)
    ('part4441-4444-4444-4444-444444444444', 'game4444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Tennis' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('part4442-4444-4444-4444-444444444444', 'game4444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Tennis' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part4443-4444-4444-4444-444444444444', 'game4444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Tennis' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),

    -- Badminton game (5 confirmed)
    ('part5551-5555-5555-5555-555555555555', 'game5555-5555-5555-5555-555555555555', '99999999-9999-9999-9999-999999999999', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('part5552-5555-5555-5555-555555555555', 'game5555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part5553-5555-5555-5555-555555555555', 'game5555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part5554-5555-5555-5555-555555555555', 'game5555-5555-5555-5555-555555555555', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part5555-5555-5555-5555-555555555555', 'game5555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),

    -- Ultimate Frisbee game (8 confirmed + 1 waitlisted)
    ('part6661-6666-6666-6666-666666666666', 'game6666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('part6662-6666-6666-6666-666666666666', 'game6666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part6663-6666-6666-6666-666666666666', 'game6666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part6664-6666-6666-6666-666666666666', 'game6666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part6665-6666-6666-6666-666666666666', 'game6666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part6666-6666-6666-6666-666666666666', 'game6666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part6667-6666-6666-6666-666666666666', 'game6666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part6668-6666-6666-6666-666666666666', 'game6666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part6669-6666-6666-6666-666666666666', 'game6666-6666-6666-6666-666666666666', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT', 'WAITLISTED', NOW(), 1),

    -- Flag Football game (10 confirmed)
    ('part7771-7777-7777-7777-777777777777', 'game7777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('part7772-7777-7777-7777-777777777777', 'game7777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part7773-7777-7777-7777-777777777777', 'game7777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part7774-7777-7777-7777-777777777777', 'game7777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part7775-7777-7777-7777-777777777777', 'game7777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part7776-7777-7777-7777-777777777777', 'game7777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part7777-7777-7777-7777-777777777777', 'game7777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part7778-7777-7777-7777-777777777777', 'game7777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part7779-7777-7777-7777-777777777777', 'game7777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part777a-7777-7777-7777-777777777777', 'game7777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),

    -- Softball game (12 confirmed)
    ('part8881-8888-8888-8888-888888888888', 'game8888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('part8882-8888-8888-8888-888888888888', 'game8888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part8883-8888-8888-8888-888888888888', 'game8888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part8884-8888-8888-8888-888888888888', 'game8888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part8885-8888-8888-8888-888888888888', 'game8888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part8886-8888-8888-8888-888888888888', 'game8888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part8887-8888-8888-8888-888888888888', 'game8888-8888-8888-8888-888888888888', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part8888-8888-8888-8888-888888888888', 'game8888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part8889-8888-8888-8888-888888888888', 'game8888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part888a-8888-8888-8888-888888888888', 'game8888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part888b-8888-8888-8888-888888888888', 'game8888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part888c-8888-8888-8888-888888888888', 'game8888-8888-8888-8888-888888888888', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),

    -- Baseball game (10 confirmed)
    ('part9991-9999-9999-9999-999999999999', 'game9999-9999-9999-9999-999999999999', 'dddddddd-dddd-dddd-dddd-dddddddddddd', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('part9992-9999-9999-9999-999999999999', 'game9999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part9993-9999-9999-9999-999999999999', 'game9999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part9994-9999-9999-9999-999999999999', 'game9999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part9995-9999-9999-9999-999999999999', 'game9999-9999-9999-9999-999999999999', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part9996-9999-9999-9999-999999999999', 'game9999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part9997-9999-9999-9999-999999999999', 'game9999-9999-9999-9999-999999999999', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part9998-9999-9999-9999-999999999999', 'game9999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part9999-9999-9999-9999-999999999999', 'game9999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('part999a-9999-9999-9999-999999999999', 'game9999-9999-9999-9999-999999999999', 'ffffffff-ffff-ffff-ffff-ffffffffffff', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),

    -- Pickleball game (5 confirmed)
    ('partaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'gameaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', (SELECT sport_id FROM sport WHERE name='Pickleball' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('partaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'gameaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Pickleball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('partaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'gameaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Pickleball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('partaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'gameaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Pickleball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('partaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'gameaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', (SELECT sport_id FROM sport WHERE name='Pickleball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),

    -- Hockey game (12 confirmed + 3 waitlisted)
    ('partbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gamebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ffffffff-ffff-ffff-ffff-ffffffffffff', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('partbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gamebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('partbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gamebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('partbbb4-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gamebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('partbbb5-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gamebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('partbbb6-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gamebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('partbbb7-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gamebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('partbbb8-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gamebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('partbbb9-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gamebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('partbbba-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gamebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('partbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gamebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('partbbbc-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gamebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('partbbbd-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gamebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'WAITLISTED', NOW(), 1),
    ('partbbbe-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gamebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'WAITLISTED', NOW(), 2),
    ('partbbbf-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gamebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'WAITLISTED', NOW(), 3)
ON CONFLICT (participation_id) DO NOTHING;
