-- V10: Expand seed data for full UI coverage
-- Adds Montreal locations, games for all 11 sports, and rich rosters

-- Additional demo users for fuller rosters (password: password123)
INSERT INTO "user" (user_id, email, password_hash, display_name, slug, bio, location, default_intensity, availability, reliability_score, games_count, created_at)
VALUES 
    ('66666666-6666-6666-6666-666666666666', 'minh.h@demo.com', '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq', 'Minh H.', 'minh-h', 'Basketball enthusiast from Montreal!', 'Montreal, QC', 'competitive', 'weekends', 98.0, 42, NOW() - INTERVAL '5 months'),
    ('77777777-7777-7777-7777-777777777777', 'omar.e@demo.com', '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq', 'Omar E.', 'omar-e', 'Volleyball player. Beach or indoor!', 'Montreal, QC', 'competitive', 'flexible', 92.0, 28, NOW() - INTERVAL '4 months'),
    ('88888888-8888-8888-8888-888888888888', 'melissa.r@demo.com', '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq', 'Melissa R.', 'melissa-r', 'Tennis doubles partner looking for games.', 'Montreal, QC', 'casual', 'weekends', 97.0, 35, NOW() - INTERVAL '6 months'),
    ('99999999-9999-9999-9999-999999999999', 'younes.b@demo.com', '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq', 'Younes B.', 'younes-b', 'Badminton and squash player.', 'Montreal, QC', 'casual', 'evenings', 94.0, 22, NOW() - INTERVAL '3 months'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alex.g@demo.com', '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq', 'Alex G.', 'alex-g', 'Ultimate frisbee captain. Spirit of the game!', 'Montreal, QC', 'competitive', 'flexible', 96.0, 51, NOW() - INTERVAL '8 months'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'david.o@demo.com', '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq', 'David O.', 'david-o', 'Flag football and softball. Weekend warrior!', 'Montreal, QC', 'competitive', 'weekends', 91.0, 38, NOW() - INTERVAL '7 months'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'steven.z@demo.com', '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq', 'Steven Z.', 'steven-z', 'All sports! Basketball, soccer, softball.', 'Montreal, QC', 'casual', 'flexible', 93.0, 45, NOW() - INTERVAL '9 months'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'youssef.y@demo.com', '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq', 'Youssef Y.', 'youssef-y', 'Baseball and hockey fan.', 'Montreal, QC', 'competitive', 'evenings', 89.0, 31, NOW() - INTERVAL '4 months'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'hudson.l@demo.com', '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq', 'Hudson L.', 'hudson-l', 'Pickleball convert! Learning the game.', 'Montreal, QC', 'beginner', 'weekends', 88.0, 12, NOW() - INTERVAL '2 months'),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'allaye.d@demo.com', '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq', 'Allaye D.', 'allaye-d', 'Hockey goalie. Full gear ready!', 'Montreal, QC', 'competitive', 'evenings', 99.0, 67, NOW() - INTERVAL '1 year')
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
    ('10c11111-1111-1111-1111-111111111111', 'Parc Jarry Courts', '201 Rue Gary-Carter', 'Montreal', 'QC', 'CA', 45.5312, -73.6205),
    ('10c22222-2222-2222-2222-222222222222', 'Complexe Claude-Robillard', '1000 Émile-Journault', 'Montreal', 'QC', 'CA', 45.5401, -73.6241),
    ('10c33333-3333-3333-3333-333333333333', 'Parc Jean-Drapeau Beach', 'Île Sainte-Hélène', 'Montreal', 'QC', 'CA', 45.5088, -73.5340),
    ('10c44444-4444-4444-4444-444444444444', 'Parc Lafontaine Tennis', 'Avenue du Parc Lafontaine', 'Montreal', 'QC', 'CA', 45.5256, -73.5698),
    ('10c55555-5555-5555-5555-555555555555', 'Centre sportif Côte-des-Neiges', '4880 Avenue Van Horne', 'Montreal', 'QC', 'CA', 45.4920, -73.6241),
    ('10c66666-6666-6666-6666-666666666666', 'Parc Maisonneuve', '4601 Rue Sherbrooke E', 'Montreal', 'QC', 'CA', 45.5569, -73.5497),
    ('10c77777-7777-7777-7777-777777777777', 'McGill Stadium', '475 Avenue des Pins O', 'Montreal', 'QC', 'CA', 45.5087, -73.5816),
    ('10c88888-8888-8888-8888-888888888888', 'Parc Jeanne-Mance', 'Avenue du Mont-Royal', 'Montreal', 'QC', 'CA', 45.5163, -73.5854),
    ('10c99999-9999-9999-9999-999999999999', 'Gary Carter Memorial Field', 'Parc Jarry', 'Montreal', 'QC', 'CA', 45.5325, -73.6180),
    ('10caaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'YMCA du Parc', '5550 Avenue du Parc', 'Montreal', 'QC', 'CA', 45.5214, -73.6058),
    ('10cbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Aréna Mont-Royal', '1000 Avenue du Mont-Royal E', 'Montreal', 'QC', 'CA', 45.5271, -73.5720)
ON CONFLICT (location_id) DO NOTHING;

-- Games for all 11 sports
INSERT INTO game (game_id, created_by_user_id, sport_id, location_id, title, description, status, intensity_band, skill_band, min_players, max_players, start_time, end_time, created_at, visibility_id)
VALUES
    -- Basketball
    ('6a3e1111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 
     (SELECT sport_id FROM sport WHERE name = 'Basketball' LIMIT 1),
     '10c11111-1111-1111-1111-111111111111',
     '5v5 Basketball Pickup', 'Competitive 5v5 full court. Bring your A game!', 'SCHEDULED', 'competitive', 'intermediate', 6, 10,
     NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '2 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),
    
    -- Soccer
    ('6a3e2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
     (SELECT sport_id FROM sport WHERE name = 'Soccer' LIMIT 1),
     '10c22222-2222-2222-2222-222222222222',
     'Sunday Soccer Friendly', 'Casual 11v11 game. All levels welcome!', 'SCHEDULED', 'casual', 'all_levels', 14, 22,
     NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '90 minutes', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Volleyball
    ('6a3e3333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777',
     (SELECT sport_id FROM sport WHERE name = 'Volleyball' LIMIT 1),
     '10c33333-3333-3333-3333-333333333333',
     'Beach Volleyball Tournament', '6v6 beach volleyball. Bring sunscreen!', 'SCHEDULED', 'competitive', 'intermediate', 8, 12,
     NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '3 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Tennis
    ('6a3e4444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888',
     (SELECT sport_id FROM sport WHERE name = 'Tennis' LIMIT 1),
     '10c44444-4444-4444-4444-444444444444',
     'Tennis Doubles Match', 'Looking for 1 more for doubles!', 'SCHEDULED', 'competitive', 'intermediate', 4, 4,
     NOW() + INTERVAL '4 days', NOW() + INTERVAL '4 days' + INTERVAL '90 minutes', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Badminton
    ('6a3e5555-5555-5555-5555-555555555555', '99999999-9999-9999-9999-999999999999',
     (SELECT sport_id FROM sport WHERE name = 'Badminton' LIMIT 1),
     '10c55555-5555-5555-5555-555555555555',
     'Badminton Drop-In', 'Casual badminton. Beginners welcome!', 'SCHEDULED', 'casual', 'all_levels', 4, 8,
     NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '2 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Ultimate Frisbee
    ('6a3e6666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     (SELECT sport_id FROM sport WHERE name = 'Ultimate Frisbee' LIMIT 1),
     '10c66666-6666-6666-6666-666666666666',
     'Ultimate Frisbee Pickup', '7v7 ultimate. Spirit of the game!', 'SCHEDULED', 'competitive', 'intermediate', 10, 14,
     NOW() + INTERVAL '2 days' + INTERVAL '1 hour', NOW() + INTERVAL '2 days' + INTERVAL '2.5 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Flag Football
    ('6a3e7777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     (SELECT sport_id FROM sport WHERE name = 'Flag Football' LIMIT 1),
     '10c77777-7777-7777-7777-777777777777',
     'Flag Football League Game', '7v7 flag football. No tackle!', 'SCHEDULED', 'competitive', 'intermediate', 10, 14,
     NOW() + INTERVAL '6 days', NOW() + INTERVAL '6 days' + INTERVAL '90 minutes', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Softball
    ('6a3e8888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
     (SELECT sport_id FROM sport WHERE name = 'Softball' LIMIT 1),
     '10c88888-8888-8888-8888-888888888888',
     'Softball Sunday', 'Friendly co-ed softball game.', 'SCHEDULED', 'casual', 'all_levels', 12, 18,
     NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Baseball
    ('6a3e9999-9999-9999-9999-999999999999', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
     (SELECT sport_id FROM sport WHERE name = 'Baseball' LIMIT 1),
     '10c99999-9999-9999-9999-999999999999',
     'Baseball Diamond Practice', '9-inning practice game.', 'SCHEDULED', 'competitive', 'intermediate', 10, 18,
     NOW() + INTERVAL '4 days' + INTERVAL '2 hours', NOW() + INTERVAL '4 days' + INTERVAL '4 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Pickleball
    ('6a3eaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
     (SELECT sport_id FROM sport WHERE name = 'Pickleball' LIMIT 1),
     '10caaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'Pickleball Beginner Session', 'Learn pickleball! Equipment provided.', 'SCHEDULED', 'beginner', 'beginner', 4, 8,
     NOW() + INTERVAL '1 day' + INTERVAL '1 hour', NOW() + INTERVAL '1 day' + INTERVAL '2.5 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- Hockey
    ('6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ffffffff-ffff-ffff-ffff-ffffffffffff',
     (SELECT sport_id FROM sport WHERE name = 'Hockey' LIMIT 1),
     '10cbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     'Hockey Shinny Night', 'Drop-in hockey. Full gear required.', 'SCHEDULED', 'competitive', 'intermediate', 12, 20,
     NOW() + INTERVAL '5 days' + INTERVAL '1 hour', NOW() + INTERVAL '5 days' + INTERVAL '2.5 hours', NOW(),
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1))
ON CONFLICT (game_id) DO NOTHING;

-- Rich rosters for the games
INSERT INTO game_participation (participation_id, game_id, user_id, sport_id, participation_role, join_status, joined_at, waitlist_position)
VALUES
    -- Basketball game (8 confirmed + 2 waitlisted)
    ('9a171111-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('9a171112-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a171113-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a171114-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a171115-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a171116-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a171117-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a171118-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a171119-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'WAITLISTED', NOW(), 1),
    ('9a17111a-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT', 'WAITLISTED', NOW(), 2),
    
    -- Soccer game (10 confirmed)
    ('9a172221-2222-2222-2222-222222222222', '6a3e2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('9a172222-2222-2222-2222-222222222222', '6a3e2222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a172223-2222-2222-2222-222222222222', '6a3e2222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a172224-2222-2222-2222-222222222222', '6a3e2222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a172225-2222-2222-2222-222222222222', '6a3e2222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a172226-2222-2222-2222-222222222222', '6a3e2222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a172227-2222-2222-2222-222222222222', '6a3e2222-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a172228-2222-2222-2222-222222222222', '6a3e2222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a172229-2222-2222-2222-222222222222', '6a3e2222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17222a-2222-2222-2222-222222222222', '6a3e2222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),

    -- Volleyball game (6 confirmed + 2 waitlisted)
    ('9a173331-3333-3333-3333-333333333333', '6a3e3333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('9a173332-3333-3333-3333-333333333333', '6a3e3333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a173333-3333-3333-3333-333333333333', '6a3e3333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a173334-3333-3333-3333-333333333333', '6a3e3333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a173335-3333-3333-3333-333333333333', '6a3e3333-3333-3333-3333-333333333333', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a173336-3333-3333-3333-333333333333', '6a3e3333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a173337-3333-3333-3333-333333333333', '6a3e3333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT', 'WAITLISTED', NOW(), 1),
    ('9a173338-3333-3333-3333-333333333333', '6a3e3333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT', 'WAITLISTED', NOW(), 2),

    -- Tennis game (3 confirmed - needs 1 more)
    ('9a174441-4444-4444-4444-444444444444', '6a3e4444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Tennis' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('9a174442-4444-4444-4444-444444444444', '6a3e4444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Tennis' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a174443-4444-4444-4444-444444444444', '6a3e4444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Tennis' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),

    -- Badminton game (5 confirmed)
    ('9a175551-5555-5555-5555-555555555555', '6a3e5555-5555-5555-5555-555555555555', '99999999-9999-9999-9999-999999999999', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('9a175552-5555-5555-5555-555555555555', '6a3e5555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a175553-5555-5555-5555-555555555555', '6a3e5555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a175554-5555-5555-5555-555555555555', '6a3e5555-5555-5555-5555-555555555555', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a175555-5555-5555-5555-555555555555', '6a3e5555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),

    -- Ultimate Frisbee game (8 confirmed + 1 waitlisted)
    ('9a176661-6666-6666-6666-666666666666', '6a3e6666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('9a176662-6666-6666-6666-666666666666', '6a3e6666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a176663-6666-6666-6666-666666666666', '6a3e6666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a176664-6666-6666-6666-666666666666', '6a3e6666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a176665-6666-6666-6666-666666666666', '6a3e6666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a176666-6666-6666-6666-666666666666', '6a3e6666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a176667-6666-6666-6666-666666666666', '6a3e6666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a176668-6666-6666-6666-666666666666', '6a3e6666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a176669-6666-6666-6666-666666666666', '6a3e6666-6666-6666-6666-666666666666', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT', 'WAITLISTED', NOW(), 1),

    -- Flag Football game (10 confirmed)
    ('9a177771-7777-7777-7777-777777777777', '6a3e7777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('9a177772-7777-7777-7777-777777777777', '6a3e7777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a177773-7777-7777-7777-777777777777', '6a3e7777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a177774-7777-7777-7777-777777777777', '6a3e7777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a177775-7777-7777-7777-777777777777', '6a3e7777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a177776-7777-7777-7777-777777777777', '6a3e7777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a177777-7777-7777-7777-777777777777', '6a3e7777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a177778-7777-7777-7777-777777777777', '6a3e7777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a177779-7777-7777-7777-777777777777', '6a3e7777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17777a-7777-7777-7777-777777777777', '6a3e7777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT sport_id FROM sport WHERE name='Flag Football' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),

    -- Softball game (12 confirmed)
    ('9a178881-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('9a178882-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a178883-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a178884-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a178885-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a178886-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a178887-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a178888-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a178889-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17888a-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17888b-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17888c-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT sport_id FROM sport WHERE name='Softball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),

    -- Baseball game (10 confirmed)
    ('9a179991-9999-9999-9999-999999999999', '6a3e9999-9999-9999-9999-999999999999', 'dddddddd-dddd-dddd-dddd-dddddddddddd', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('9a179992-9999-9999-9999-999999999999', '6a3e9999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a179993-9999-9999-9999-999999999999', '6a3e9999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a179994-9999-9999-9999-999999999999', '6a3e9999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a179995-9999-9999-9999-999999999999', '6a3e9999-9999-9999-9999-999999999999', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a179996-9999-9999-9999-999999999999', '6a3e9999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a179997-9999-9999-9999-999999999999', '6a3e9999-9999-9999-9999-999999999999', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a179998-9999-9999-9999-999999999999', '6a3e9999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a179999-9999-9999-9999-999999999999', '6a3e9999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17999a-9999-9999-9999-999999999999', '6a3e9999-9999-9999-9999-999999999999', 'ffffffff-ffff-ffff-ffff-ffffffffffff', (SELECT sport_id FROM sport WHERE name='Baseball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),

    -- Pickleball game (5 confirmed)
    ('9a17aaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '6a3eaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', (SELECT sport_id FROM sport WHERE name='Pickleball' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('9a17aaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '6a3eaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Pickleball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17aaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '6a3eaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Pickleball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17aaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '6a3eaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Pickleball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17aaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '6a3eaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', (SELECT sport_id FROM sport WHERE name='Pickleball' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),

    -- Hockey game (12 confirmed + 3 waitlisted)
    ('9a17bbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ffffffff-ffff-ffff-ffff-ffffffffffff', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
    ('9a17bbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17bbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17bbb4-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17bbb5-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17bbb6-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17bbb7-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17bbb8-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17bbb9-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17bbba-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17bbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17bbbc-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
    ('9a17bbbd-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'WAITLISTED', NOW(), 1),
    ('9a17bbbe-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'WAITLISTED', NOW(), 2),
    ('9a17bbbf-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT', 'WAITLISTED', NOW(), 3)
ON CONFLICT (participation_id) DO NOTHING;
