-- V11: Expand seed data for full UI coverage - Montreal edition
-- SECURITY NOTE: Demo passwords for local development ONLY. Not used in production.
-- @sonar.exclusion - Demo seed data for local development

-- Montreal demo users with password constant
DO $$
DECLARE
    demo_hash CONSTANT TEXT := '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq'; -- NOSONAR: Demo data only
BEGIN
    INSERT INTO "user" (user_id, email, password_hash, display_name, slug, bio, location, default_intensity, availability, reliability_score, games_count, created_at)
    VALUES 
        ('66666666-6666-6666-6666-666666666666', 'minh.h@demo.com', demo_hash, 'Minh H.', 'minh-h', 'Basketball enthusiast from Montreal!', 'Montreal, QC', 'competitive', 'weekends', 98.0, 42, NOW() - INTERVAL '5 months'),
        ('77777777-7777-7777-7777-777777777777', 'omar.e@demo.com', demo_hash, 'Omar E.', 'omar-e', 'Volleyball player. Beach or indoor!', 'Montreal, QC', 'competitive', 'flexible', 92.0, 28, NOW() - INTERVAL '4 months'),
        ('88888888-8888-8888-8888-888888888888', 'melissa.r@demo.com', demo_hash, 'Melissa R.', 'melissa-r', 'Tennis doubles partner looking for games.', 'Montreal, QC', 'casual', 'weekends', 97.0, 35, NOW() - INTERVAL '6 months'),
        ('99999999-9999-9999-9999-999999999999', 'younes.b@demo.com', demo_hash, 'Younes B.', 'younes-b', 'Badminton and squash player.', 'Montreal, QC', 'casual', 'evenings', 94.0, 22, NOW() - INTERVAL '3 months'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alex.g@demo.com', demo_hash, 'Alex G.', 'alex-g', 'Ultimate frisbee captain. Spirit of the game!', 'Montreal, QC', 'competitive', 'flexible', 96.0, 51, NOW() - INTERVAL '8 months'),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'david.o@demo.com', demo_hash, 'David O.', 'david-o', 'Flag football and softball. Weekend warrior!', 'Montreal, QC', 'competitive', 'weekends', 91.0, 38, NOW() - INTERVAL '7 months'),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'steven.z@demo.com', demo_hash, 'Steven Z.', 'steven-z', 'All sports! Basketball, soccer, softball.', 'Montreal, QC', 'casual', 'flexible', 93.0, 45, NOW() - INTERVAL '9 months'),
        ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'youssef.y@demo.com', demo_hash, 'Youssef Y.', 'youssef-y', 'Baseball and hockey fan.', 'Montreal, QC', 'competitive', 'evenings', 89.0, 31, NOW() - INTERVAL '4 months'),
        ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'hudson.l@demo.com', demo_hash, 'Hudson L.', 'hudson-l', 'Pickleball convert! Learning the game.', 'Montreal, QC', 'beginner', 'weekends', 88.0, 12, NOW() - INTERVAL '2 months'),
        ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'allaye.d@demo.com', demo_hash, 'Allaye D.', 'allaye-d', 'Hockey goalie. Full gear ready!', 'Montreal, QC', 'competitive', 'evenings', 99.0, 67, NOW() - INTERVAL '1 year')
    ON CONFLICT (user_id) DO NOTHING;
END $$;

-- Assign roles to new users
INSERT INTO user_role (user_id, role_id)
SELECT u.user_id, r.role_id FROM "user" u CROSS JOIN role r
WHERE r.name = 'user' AND u.email LIKE '%@demo.com'
ON CONFLICT DO NOTHING;

-- Montreal locations (consolidated)
INSERT INTO location (location_id, name, address_line, city, region, country, latitude, longitude) VALUES
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

-- Helper function to get sport_id and visibility_id (reduces SELECT duplication)
DO $$
DECLARE
    v_public UUID := (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1);
    s_basketball UUID := (SELECT sport_id FROM sport WHERE name = 'Basketball' LIMIT 1);
    s_soccer UUID := (SELECT sport_id FROM sport WHERE name = 'Soccer' LIMIT 1);
    s_volleyball UUID := (SELECT sport_id FROM sport WHERE name = 'Volleyball' LIMIT 1);
    s_tennis UUID := (SELECT sport_id FROM sport WHERE name = 'Tennis' LIMIT 1);
    s_badminton UUID := (SELECT sport_id FROM sport WHERE name = 'Badminton' LIMIT 1);
    s_frisbee UUID := (SELECT sport_id FROM sport WHERE name = 'Ultimate Frisbee' LIMIT 1);
    s_football UUID := (SELECT sport_id FROM sport WHERE name = 'Flag Football' LIMIT 1);
    s_softball UUID := (SELECT sport_id FROM sport WHERE name = 'Softball' LIMIT 1);
    s_baseball UUID := (SELECT sport_id FROM sport WHERE name = 'Baseball' LIMIT 1);
    s_pickleball UUID := (SELECT sport_id FROM sport WHERE name = 'Pickleball' LIMIT 1);
    s_hockey UUID := (SELECT sport_id FROM sport WHERE name = 'Hockey' LIMIT 1);
BEGIN
    -- Games for all 11 sports
    INSERT INTO game (game_id, created_by_user_id, sport_id, location_id, title, description, status, intensity_band, skill_band, min_players, max_players, start_time, end_time, created_at, visibility_id) VALUES
        ('6a3e1111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', s_basketball, '10c11111-1111-1111-1111-111111111111', '5v5 Basketball Pickup', 'Competitive 5v5 full court.', 'SCHEDULED', 'competitive', 'intermediate', 6, 10, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 2 hours', NOW(), v_public),
        ('6a3e2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', s_soccer, '10c22222-2222-2222-2222-222222222222', 'Sunday Soccer Friendly', 'Casual 11v11 game.', 'SCHEDULED', 'casual', 'all_levels', 14, 22, NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 90 minutes', NOW(), v_public),
        ('6a3e3333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', s_volleyball, '10c33333-3333-3333-3333-333333333333', 'Beach Volleyball Tournament', '6v6 beach volleyball.', 'SCHEDULED', 'competitive', 'intermediate', 8, 12, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 3 hours', NOW(), v_public),
        ('6a3e4444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', s_tennis, '10c44444-4444-4444-4444-444444444444', 'Tennis Doubles Match', 'Looking for doubles partner!', 'SCHEDULED', 'competitive', 'intermediate', 4, 4, NOW() + INTERVAL '4 days', NOW() + INTERVAL '4 days 90 minutes', NOW(), v_public),
        ('6a3e5555-5555-5555-5555-555555555555', '99999999-9999-9999-9999-999999999999', s_badminton, '10c55555-5555-5555-5555-555555555555', 'Badminton Drop-In', 'Casual badminton.', 'SCHEDULED', 'casual', 'all_levels', 4, 8, NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 2 hours', NOW(), v_public),
        ('6a3e6666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', s_frisbee, '10c66666-6666-6666-6666-666666666666', 'Ultimate Frisbee Pickup', '7v7 ultimate. Spirit!', 'SCHEDULED', 'competitive', 'intermediate', 10, 14, NOW() + INTERVAL '2 days 1 hour', NOW() + INTERVAL '2 days 3 hours', NOW(), v_public),
        ('6a3e7777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', s_football, '10c77777-7777-7777-7777-777777777777', 'Flag Football League Game', '7v7 flag football.', 'SCHEDULED', 'competitive', 'intermediate', 10, 14, NOW() + INTERVAL '6 days', NOW() + INTERVAL '6 days 90 minutes', NOW(), v_public),
        ('6a3e8888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', s_softball, '10c88888-8888-8888-8888-888888888888', 'Softball Sunday', 'Friendly co-ed softball.', 'SCHEDULED', 'casual', 'all_levels', 12, 18, NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 3 hours', NOW(), v_public),
        ('6a3e9999-9999-9999-9999-999999999999', 'dddddddd-dddd-dddd-dddd-dddddddddddd', s_baseball, '10c99999-9999-9999-9999-999999999999', 'Baseball Diamond Practice', '9-inning practice game.', 'SCHEDULED', 'competitive', 'intermediate', 10, 18, NOW() + INTERVAL '4 days 2 hours', NOW() + INTERVAL '4 days 4 hours', NOW(), v_public),
        ('6a3eaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', s_pickleball, '10caaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pickleball Beginner Session', 'Learn pickleball!', 'SCHEDULED', 'beginner', 'beginner', 4, 8, NOW() + INTERVAL '1 day 1 hour', NOW() + INTERVAL '1 day 3 hours', NOW(), v_public),
        ('6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ffffffff-ffff-ffff-ffff-ffffffffffff', s_hockey, '10cbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Hockey Shinny Night', 'Drop-in hockey. Full gear.', 'SCHEDULED', 'competitive', 'intermediate', 12, 20, NOW() + INTERVAL '5 days 1 hour', NOW() + INTERVAL '5 days 3 hours', NOW(), v_public)
    ON CONFLICT (game_id) DO NOTHING;

    -- Game participations using sport variables
    INSERT INTO game_participation (participation_id, game_id, user_id, sport_id, participation_role, join_status, joined_at, waitlist_position) VALUES
        -- Basketball (8 confirmed + 2 waitlist)
        ('9a171111-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', s_basketball, 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
        ('9a171112-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', s_basketball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a171113-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', s_basketball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a171114-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', s_basketball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a171115-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', s_basketball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a171116-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', s_basketball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a171117-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', s_basketball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a171118-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', s_basketball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a171119-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', s_basketball, 'PARTICIPANT', 'WAITLISTED', NOW(), 1),
        ('9a17111a-1111-1111-1111-111111111111', '6a3e1111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', s_basketball, 'PARTICIPANT', 'WAITLISTED', NOW(), 2),
        -- Soccer (6 confirmed)
        ('9a172221-2222-2222-2222-222222222222', '6a3e2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', s_soccer, 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
        ('9a172222-2222-2222-2222-222222222222', '6a3e2222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', s_soccer, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a172223-2222-2222-2222-222222222222', '6a3e2222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', s_soccer, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a172224-2222-2222-2222-222222222222', '6a3e2222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', s_soccer, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a172225-2222-2222-2222-222222222222', '6a3e2222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888', s_soccer, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a172226-2222-2222-2222-222222222222', '6a3e2222-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999', s_soccer, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        -- Volleyball (6 confirmed)
        ('9a173331-3333-3333-3333-333333333333', '6a3e3333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', s_volleyball, 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
        ('9a173332-3333-3333-3333-333333333333', '6a3e3333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', s_volleyball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a173333-3333-3333-3333-333333333333', '6a3e3333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', s_volleyball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a173334-3333-3333-3333-333333333333', '6a3e3333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', s_volleyball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a173335-3333-3333-3333-333333333333', '6a3e3333-3333-3333-3333-333333333333', '88888888-8888-8888-8888-888888888888', s_volleyball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a173336-3333-3333-3333-333333333333', '6a3e3333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', s_volleyball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        -- Tennis (3 confirmed)
        ('9a174441-4444-4444-4444-444444444444', '6a3e4444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', s_tennis, 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
        ('9a174442-4444-4444-4444-444444444444', '6a3e4444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', s_tennis, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a174443-4444-4444-4444-444444444444', '6a3e4444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', s_tennis, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        -- Badminton (4 confirmed)
        ('9a175551-5555-5555-5555-555555555555', '6a3e5555-5555-5555-5555-555555555555', '99999999-9999-9999-9999-999999999999', s_badminton, 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
        ('9a175552-5555-5555-5555-555555555555', '6a3e5555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', s_badminton, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a175553-5555-5555-5555-555555555555', '6a3e5555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777', s_badminton, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a175554-5555-5555-5555-555555555555', '6a3e5555-5555-5555-5555-555555555555', '88888888-8888-8888-8888-888888888888', s_badminton, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        -- Ultimate Frisbee (5 confirmed)
        ('9a176661-6666-6666-6666-666666666666', '6a3e6666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', s_frisbee, 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
        ('9a176662-6666-6666-6666-666666666666', '6a3e6666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', s_frisbee, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a176663-6666-6666-6666-666666666666', '6a3e6666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', s_frisbee, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a176664-6666-6666-6666-666666666666', '6a3e6666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', s_frisbee, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a176665-6666-6666-6666-666666666666', '6a3e6666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', s_frisbee, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        -- Flag Football (5 confirmed)
        ('9a177771-7777-7777-7777-777777777777', '6a3e7777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', s_football, 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
        ('9a177772-7777-7777-7777-777777777777', '6a3e7777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', s_football, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a177773-7777-7777-7777-777777777777', '6a3e7777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', s_football, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a177774-7777-7777-7777-777777777777', '6a3e7777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', s_football, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a177775-7777-7777-7777-777777777777', '6a3e7777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', s_football, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        -- Softball (6 confirmed)
        ('9a178881-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', s_softball, 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
        ('9a178882-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', s_softball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a178883-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', s_softball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a178884-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', s_softball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a178885-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', s_softball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a178886-8888-8888-8888-888888888888', '6a3e8888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', s_softball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        -- Baseball (5 confirmed)
        ('9a179991-9999-9999-9999-999999999999', '6a3e9999-9999-9999-9999-999999999999', 'dddddddd-dddd-dddd-dddd-dddddddddddd', s_baseball, 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
        ('9a179992-9999-9999-9999-999999999999', '6a3e9999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', s_baseball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a179993-9999-9999-9999-999999999999', '6a3e9999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', s_baseball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a179994-9999-9999-9999-999999999999', '6a3e9999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', s_baseball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a179995-9999-9999-9999-999999999999', '6a3e9999-9999-9999-9999-999999999999', '55555555-5555-5555-5555-555555555555', s_baseball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        -- Pickleball (4 confirmed)
        ('9a17aaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '6a3eaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', s_pickleball, 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
        ('9a17aaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '6a3eaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', s_pickleball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a17aaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '6a3eaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', s_pickleball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a17aaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '6a3eaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '88888888-8888-8888-8888-888888888888', s_pickleball, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        -- Hockey (8 confirmed + 2 waitlist)
        ('9a17bbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ffffffff-ffff-ffff-ffff-ffffffffffff', s_hockey, 'ORGANIZER', 'CONFIRMED', NOW(), NULL),
        ('9a17bbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', s_hockey, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a17bbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', s_hockey, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a17bbb4-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', s_hockey, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a17bbb5-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', s_hockey, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a17bbb6-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', s_hockey, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a17bbb7-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666666', s_hockey, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a17bbb8-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '77777777-7777-7777-7777-777777777777', s_hockey, 'PARTICIPANT', 'CONFIRMED', NOW(), NULL),
        ('9a17bbb9-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', s_hockey, 'PARTICIPANT', 'WAITLISTED', NOW(), 1),
        ('9a17bbba-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6a3ebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', s_hockey, 'PARTICIPANT', 'WAITLISTED', NOW(), 2)
    ON CONFLICT (participation_id) DO NOTHING;
END $$;
