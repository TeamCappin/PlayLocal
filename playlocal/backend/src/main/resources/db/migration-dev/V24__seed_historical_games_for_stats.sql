-- Dev seed (V24): Historical games spread across 6 months for Stats & Analytics skill evolution chart.
-- Each game has a different skill_band / intensity_band combination so the chart shows
-- a progression over time.  Eight demo users are added as confirmed participants.

-- ============================================================================
-- Games (8 historical games, status = COMPLETED)
-- ============================================================================
INSERT INTO game (game_id, created_by_user_id, sport_id, location_id, title, description,
                  status, intensity_band, skill_band, min_players, max_players,
                  start_time, end_time, created_at, visibility_id)
VALUES
    -- 6 months ago – Beginner / Beginner  (score 0)
    ('fade0001-fade-fade-fade-fade00000001',
     '11111111-1111-1111-1111-111111111111',
     (SELECT sport_id FROM sport WHERE name = 'Basketball' LIMIT 1),
     'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'Beginner Basketball Clinic', 'Learn the basics!',
     'COMPLETED', 'beginner', 'beginner', 4, 10,
     NOW() - INTERVAL '6 months',
     NOW() - INTERVAL '6 months' + INTERVAL '2 hours',
     NOW() - INTERVAL '6 months',
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- 5 months ago – Intermediate / Casual  (score 50)
    ('fade0002-fade-fade-fade-fade00000002',
     '22222222-2222-2222-2222-222222222222',
     (SELECT sport_id FROM sport WHERE name = 'Soccer' LIMIT 1),
     'aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'Casual Soccer Scrimmage', 'Friendly 7-a-side.',
     'COMPLETED', 'casual', 'intermediate', 6, 14,
     NOW() - INTERVAL '5 months',
     NOW() - INTERVAL '5 months' + INTERVAL '90 minutes',
     NOW() - INTERVAL '5 months',
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- 4 months ago – Advanced / Competitive  (score 100)
    ('fade0003-fade-fade-fade-fade00000003',
     '33333333-3333-3333-3333-333333333333',
     (SELECT sport_id FROM sport WHERE name = 'Basketball' LIMIT 1),
     '10c11111-1111-1111-1111-111111111111',
     'Competitive 5v5 Tournament', 'Advanced players only.',
     'COMPLETED', 'competitive', 'advanced', 8, 10,
     NOW() - INTERVAL '4 months',
     NOW() - INTERVAL '4 months' + INTERVAL '2 hours',
     NOW() - INTERVAL '4 months',
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- 3 months ago (early) – Beginner / Casual  (score 25)
    ('fade0004-fade-fade-fade-fade00000004',
     '44444444-4444-4444-4444-444444444444',
     (SELECT sport_id FROM sport WHERE name = 'Volleyball' LIMIT 1),
     '10c33333-3333-3333-3333-333333333333',
     'Casual Volleyball Meetup', 'Beginners welcome.',
     'COMPLETED', 'casual', 'beginner', 4, 8,
     NOW() - INTERVAL '3 months 15 days',
     NOW() - INTERVAL '3 months 15 days' + INTERVAL '2 hours',
     NOW() - INTERVAL '3 months 15 days',
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- 3 months ago (late) – Intermediate / Competitive  (score 75)
    ('fade0005-fade-fade-fade-fade00000005',
     '55555555-5555-5555-5555-555555555555',
     (SELECT sport_id FROM sport WHERE name = 'Tennis' LIMIT 1),
     '10c44444-4444-4444-4444-444444444444',
     'Competitive Tennis Doubles', 'Intermediate and up.',
     'COMPLETED', 'competitive', 'intermediate', 4, 4,
     NOW() - INTERVAL '3 months',
     NOW() - INTERVAL '3 months' + INTERVAL '90 minutes',
     NOW() - INTERVAL '3 months',
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- 2 months ago – Advanced / Casual  (score 75)
    ('fade0006-fade-fade-fade-fade00000006',
     '66666666-6666-6666-6666-666666666666',
     (SELECT sport_id FROM sport WHERE name = 'Badminton' LIMIT 1),
     '10c55555-5555-5555-5555-555555555555',
     'Casual Advanced Badminton', 'High-level but relaxed.',
     'COMPLETED', 'casual', 'advanced', 4, 8,
     NOW() - INTERVAL '2 months',
     NOW() - INTERVAL '2 months' + INTERVAL '2 hours',
     NOW() - INTERVAL '2 months',
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- 1 month ago – Intermediate / Competitive  (score 75)
    ('fade0007-fade-fade-fade-fade00000007',
     '77777777-7777-7777-7777-777777777777',
     (SELECT sport_id FROM sport WHERE name = 'Ultimate Frisbee' LIMIT 1),
     '10c66666-6666-6666-6666-666666666666',
     'Competitive Ultimate Frisbee', '7v7 spirit game.',
     'COMPLETED', 'competitive', 'intermediate', 10, 14,
     NOW() - INTERVAL '1 month',
     NOW() - INTERVAL '1 month' + INTERVAL '2 hours',
     NOW() - INTERVAL '1 month',
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1)),

    -- 15 days ago – Advanced / Competitive  (score 100)
    ('fade0008-fade-fade-fade-fade00000008',
     '88888888-8888-8888-8888-888888888888',
     (SELECT sport_id FROM sport WHERE name = 'Hockey' LIMIT 1),
     '10cbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     'Competitive Shinny Night', 'Advanced players.',
     'COMPLETED', 'competitive', 'advanced', 10, 20,
     NOW() - INTERVAL '15 days',
     NOW() - INTERVAL '15 days' + INTERVAL '2 hours',
     NOW() - INTERVAL '15 days',
     (SELECT game_visibility_id FROM game_visibility WHERE code = 'public' LIMIT 1))
ON CONFLICT (game_id) DO NOTHING;


-- ============================================================================
-- Participations: 8 demo users × 8 historical games = 64 rows
-- Users: 11111111, 22222222, 33333333, 44444444, 55555555, 66666666, 77777777, 88888888
-- The game creator is ORGANIZER; others are PARTICIPANT.
-- ============================================================================

-- Game 1  (fade0001 – Basketball, created by 11111111)
INSERT INTO game_participation (participation_id, game_id, user_id, sport_id, participation_role, join_status, joined_at, waitlist_position) VALUES
    ('fade1001-fade-fade-fade-fade00000001', 'fade0001-fade-fade-fade-fade00000001', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'ORGANIZER',    'CONFIRMED', NOW() - INTERVAL '6 months', NULL),
    ('fade1002-fade-fade-fade-fade00000002', 'fade0001-fade-fade-fade-fade00000001', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '6 months', NULL),
    ('fade1003-fade-fade-fade-fade00000003', 'fade0001-fade-fade-fade-fade00000001', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '6 months', NULL),
    ('fade1004-fade-fade-fade-fade00000004', 'fade0001-fade-fade-fade-fade00000001', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '6 months', NULL),
    ('fade1005-fade-fade-fade-fade00000005', 'fade0001-fade-fade-fade-fade00000001', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '6 months', NULL),
    ('fade1006-fade-fade-fade-fade00000006', 'fade0001-fade-fade-fade-fade00000001', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '6 months', NULL),
    ('fade1007-fade-fade-fade-fade00000007', 'fade0001-fade-fade-fade-fade00000001', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '6 months', NULL),
    ('fade1008-fade-fade-fade-fade00000008', 'fade0001-fade-fade-fade-fade00000001', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '6 months', NULL)
ON CONFLICT (participation_id) DO NOTHING;

-- Game 2  (fade0002 – Soccer, created by 22222222)
INSERT INTO game_participation (participation_id, game_id, user_id, sport_id, participation_role, join_status, joined_at, waitlist_position) VALUES
    ('fade1009-fade-fade-fade-fade00000009', 'fade0002-fade-fade-fade-fade00000002', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'ORGANIZER',    'CONFIRMED', NOW() - INTERVAL '5 months', NULL),
    ('fade100a-fade-fade-fade-fade0000000a', 'fade0002-fade-fade-fade-fade00000002', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '5 months', NULL),
    ('fade100b-fade-fade-fade-fade0000000b', 'fade0002-fade-fade-fade-fade00000002', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '5 months', NULL),
    ('fade100c-fade-fade-fade-fade0000000c', 'fade0002-fade-fade-fade-fade00000002', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '5 months', NULL),
    ('fade100d-fade-fade-fade-fade0000000d', 'fade0002-fade-fade-fade-fade00000002', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '5 months', NULL),
    ('fade100e-fade-fade-fade-fade0000000e', 'fade0002-fade-fade-fade-fade00000002', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '5 months', NULL),
    ('fade100f-fade-fade-fade-fade0000000f', 'fade0002-fade-fade-fade-fade00000002', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '5 months', NULL),
    ('fade1010-fade-fade-fade-fade00000010', 'fade0002-fade-fade-fade-fade00000002', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Soccer' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '5 months', NULL)
ON CONFLICT (participation_id) DO NOTHING;

-- Game 3  (fade0003 – Basketball, created by 33333333)
INSERT INTO game_participation (participation_id, game_id, user_id, sport_id, participation_role, join_status, joined_at, waitlist_position) VALUES
    ('fade1011-fade-fade-fade-fade00000011', 'fade0003-fade-fade-fade-fade00000003', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'ORGANIZER',    'CONFIRMED', NOW() - INTERVAL '4 months', NULL),
    ('fade1012-fade-fade-fade-fade00000012', 'fade0003-fade-fade-fade-fade00000003', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '4 months', NULL),
    ('fade1013-fade-fade-fade-fade00000013', 'fade0003-fade-fade-fade-fade00000003', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '4 months', NULL),
    ('fade1014-fade-fade-fade-fade00000014', 'fade0003-fade-fade-fade-fade00000003', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '4 months', NULL),
    ('fade1015-fade-fade-fade-fade00000015', 'fade0003-fade-fade-fade-fade00000003', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '4 months', NULL),
    ('fade1016-fade-fade-fade-fade00000016', 'fade0003-fade-fade-fade-fade00000003', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '4 months', NULL),
    ('fade1017-fade-fade-fade-fade00000017', 'fade0003-fade-fade-fade-fade00000003', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '4 months', NULL),
    ('fade1018-fade-fade-fade-fade00000018', 'fade0003-fade-fade-fade-fade00000003', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Basketball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '4 months', NULL)
ON CONFLICT (participation_id) DO NOTHING;

-- Game 4  (fade0004 – Volleyball, created by 44444444)
INSERT INTO game_participation (participation_id, game_id, user_id, sport_id, participation_role, join_status, joined_at, waitlist_position) VALUES
    ('fade1019-fade-fade-fade-fade00000019', 'fade0004-fade-fade-fade-fade00000004', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'ORGANIZER',    'CONFIRMED', NOW() - INTERVAL '3 months 15 days', NULL),
    ('fade101a-fade-fade-fade-fade0000001a', 'fade0004-fade-fade-fade-fade00000004', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '3 months 15 days', NULL),
    ('fade101b-fade-fade-fade-fade0000001b', 'fade0004-fade-fade-fade-fade00000004', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '3 months 15 days', NULL),
    ('fade101c-fade-fade-fade-fade0000001c', 'fade0004-fade-fade-fade-fade00000004', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '3 months 15 days', NULL),
    ('fade101d-fade-fade-fade-fade0000001d', 'fade0004-fade-fade-fade-fade00000004', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '3 months 15 days', NULL),
    ('fade101e-fade-fade-fade-fade0000001e', 'fade0004-fade-fade-fade-fade00000004', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '3 months 15 days', NULL),
    ('fade101f-fade-fade-fade-fade0000001f', 'fade0004-fade-fade-fade-fade00000004', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '3 months 15 days', NULL),
    ('fade1020-fade-fade-fade-fade00000020', 'fade0004-fade-fade-fade-fade00000004', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Volleyball' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '3 months 15 days', NULL)
ON CONFLICT (participation_id) DO NOTHING;

-- Game 5  (fade0005 – Tennis, created by 55555555)
INSERT INTO game_participation (participation_id, game_id, user_id, sport_id, participation_role, join_status, joined_at, waitlist_position) VALUES
    ('fade1021-fade-fade-fade-fade00000021', 'fade0005-fade-fade-fade-fade00000005', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Tennis' LIMIT 1), 'ORGANIZER',    'CONFIRMED', NOW() - INTERVAL '3 months', NULL),
    ('fade1022-fade-fade-fade-fade00000022', 'fade0005-fade-fade-fade-fade00000005', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Tennis' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '3 months', NULL),
    ('fade1023-fade-fade-fade-fade00000023', 'fade0005-fade-fade-fade-fade00000005', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Tennis' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '3 months', NULL),
    ('fade1024-fade-fade-fade-fade00000024', 'fade0005-fade-fade-fade-fade00000005', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Tennis' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '3 months', NULL),
    ('fade1025-fade-fade-fade-fade00000025', 'fade0005-fade-fade-fade-fade00000005', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Tennis' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '3 months', NULL),
    ('fade1026-fade-fade-fade-fade00000026', 'fade0005-fade-fade-fade-fade00000005', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Tennis' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '3 months', NULL),
    ('fade1027-fade-fade-fade-fade00000027', 'fade0005-fade-fade-fade-fade00000005', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Tennis' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '3 months', NULL),
    ('fade1028-fade-fade-fade-fade00000028', 'fade0005-fade-fade-fade-fade00000005', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Tennis' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '3 months', NULL)
ON CONFLICT (participation_id) DO NOTHING;

-- Game 6  (fade0006 – Badminton, created by 66666666)
INSERT INTO game_participation (participation_id, game_id, user_id, sport_id, participation_role, join_status, joined_at, waitlist_position) VALUES
    ('fade1029-fade-fade-fade-fade00000029', 'fade0006-fade-fade-fade-fade00000006', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'ORGANIZER',    'CONFIRMED', NOW() - INTERVAL '2 months', NULL),
    ('fade102a-fade-fade-fade-fade0000002a', 'fade0006-fade-fade-fade-fade00000006', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '2 months', NULL),
    ('fade102b-fade-fade-fade-fade0000002b', 'fade0006-fade-fade-fade-fade00000006', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '2 months', NULL),
    ('fade102c-fade-fade-fade-fade0000002c', 'fade0006-fade-fade-fade-fade00000006', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '2 months', NULL),
    ('fade102d-fade-fade-fade-fade0000002d', 'fade0006-fade-fade-fade-fade00000006', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '2 months', NULL),
    ('fade102e-fade-fade-fade-fade0000002e', 'fade0006-fade-fade-fade-fade00000006', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '2 months', NULL),
    ('fade102f-fade-fade-fade-fade0000002f', 'fade0006-fade-fade-fade-fade00000006', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '2 months', NULL),
    ('fade1030-fade-fade-fade-fade00000030', 'fade0006-fade-fade-fade-fade00000006', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Badminton' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '2 months', NULL)
ON CONFLICT (participation_id) DO NOTHING;

-- Game 7  (fade0007 – Ultimate Frisbee, created by 77777777)
INSERT INTO game_participation (participation_id, game_id, user_id, sport_id, participation_role, join_status, joined_at, waitlist_position) VALUES
    ('fade1031-fade-fade-fade-fade00000031', 'fade0007-fade-fade-fade-fade00000007', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'ORGANIZER',    'CONFIRMED', NOW() - INTERVAL '1 month', NULL),
    ('fade1032-fade-fade-fade-fade00000032', 'fade0007-fade-fade-fade-fade00000007', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '1 month', NULL),
    ('fade1033-fade-fade-fade-fade00000033', 'fade0007-fade-fade-fade-fade00000007', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '1 month', NULL),
    ('fade1034-fade-fade-fade-fade00000034', 'fade0007-fade-fade-fade-fade00000007', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '1 month', NULL),
    ('fade1035-fade-fade-fade-fade00000035', 'fade0007-fade-fade-fade-fade00000007', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '1 month', NULL),
    ('fade1036-fade-fade-fade-fade00000036', 'fade0007-fade-fade-fade-fade00000007', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '1 month', NULL),
    ('fade1037-fade-fade-fade-fade00000037', 'fade0007-fade-fade-fade-fade00000007', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '1 month', NULL),
    ('fade1038-fade-fade-fade-fade00000038', 'fade0007-fade-fade-fade-fade00000007', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Ultimate Frisbee' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '1 month', NULL)
ON CONFLICT (participation_id) DO NOTHING;

-- Game 8  (fade0008 – Hockey, created by 88888888)
INSERT INTO game_participation (participation_id, game_id, user_id, sport_id, participation_role, join_status, joined_at, waitlist_position) VALUES
    ('fade1039-fade-fade-fade-fade00000039', 'fade0008-fade-fade-fade-fade00000008', '88888888-8888-8888-8888-888888888888', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'ORGANIZER',    'CONFIRMED', NOW() - INTERVAL '15 days', NULL),
    ('fade103a-fade-fade-fade-fade0000003a', 'fade0008-fade-fade-fade-fade00000008', '11111111-1111-1111-1111-111111111111', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '15 days', NULL),
    ('fade103b-fade-fade-fade-fade0000003b', 'fade0008-fade-fade-fade-fade00000008', '22222222-2222-2222-2222-222222222222', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '15 days', NULL),
    ('fade103c-fade-fade-fade-fade0000003c', 'fade0008-fade-fade-fade-fade00000008', '33333333-3333-3333-3333-333333333333', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '15 days', NULL),
    ('fade103d-fade-fade-fade-fade0000003d', 'fade0008-fade-fade-fade-fade00000008', '44444444-4444-4444-4444-444444444444', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '15 days', NULL),
    ('fade103e-fade-fade-fade-fade0000003e', 'fade0008-fade-fade-fade-fade00000008', '55555555-5555-5555-5555-555555555555', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '15 days', NULL),
    ('fade103f-fade-fade-fade-fade0000003f', 'fade0008-fade-fade-fade-fade00000008', '66666666-6666-6666-6666-666666666666', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '15 days', NULL),
    ('fade1040-fade-fade-fade-fade00000040', 'fade0008-fade-fade-fade-fade00000008', '77777777-7777-7777-7777-777777777777', (SELECT sport_id FROM sport WHERE name='Hockey' LIMIT 1), 'PARTICIPANT',  'CONFIRMED', NOW() - INTERVAL '15 days', NULL)
ON CONFLICT (participation_id) DO NOTHING;


-- ============================================================================
-- Attendance: mark most historical participations as ATTENDED, a few as NO_SHOW.
-- This gives users realistic show-up-rate and attendance-rate data.
-- ============================================================================

-- Bulk-set all V20 participations to ATTENDED first
UPDATE game_participation
   SET attendance_status = 'ATTENDED',
       attendance_confirmed_at = joined_at
 WHERE participation_id::text LIKE 'fade1%';

-- Sprinkle a few NO_SHOW entries for realism (~1 per game, rotating users)
UPDATE game_participation SET attendance_status = 'NO_SHOW', attendance_confirmed_at = joined_at
 WHERE participation_id IN (
    'fade1008-fade-fade-fade-fade00000008',  -- Game 1: user 88888888
    'fade100f-fade-fade-fade-fade0000000f',  -- Game 2: user 77777777
    'fade1014-fade-fade-fade-fade00000014',  -- Game 3: user 44444444
    'fade101e-fade-fade-fade-fade0000001e',  -- Game 4: user 66666666
    'fade1027-fade-fade-fade-fade00000027',  -- Game 5: user 77777777
    'fade102d-fade-fade-fade-fade0000002d',  -- Game 6: user 44444444
    'fade1037-fade-fade-fade-fade00000037',  -- Game 7: user 66666666
    'fade103c-fade-fade-fade-fade0000003c'   -- Game 8: user 33333333
 );
