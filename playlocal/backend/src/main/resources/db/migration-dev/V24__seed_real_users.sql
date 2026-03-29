INSERT INTO game_participation (participation_id, game_id, user_id, sport_id, participation_role, join_status, attendance_status, joined_at)
SELECT gen_random_uuid(), g.game_id, 'f902a50d-a613-4040-8fbf-8e7aab4c77e7', g.sport_id, 'PARTICIPANT', 'CONFIRMED', 'UNKNOWN', NOW() - INTERVAL '3 months'
FROM game g WHERE g.game_id::text IN ('fade0001-fade-fade-fade-fade00000001', 'fade0002-fade-fade-fade-fade00000002', 'fade0003-fade-fade-fade-fade00000003', 'fade0004-fade-fade-fade-fade00000004', 'fade0005-fade-fade-fade-fade00000005', 'fade0006-fade-fade-fade-fade00000006')
ON CONFLICT DO NOTHING;

INSERT INTO game_participation (participation_id, game_id, user_id, sport_id, participation_role, join_status, attendance_status, joined_at)
SELECT gen_random_uuid(), g.game_id, '5e0916b1-c174-4f3c-96ec-e044fa6f9a99', g.sport_id, 'PARTICIPANT', 'CONFIRMED', 'UNKNOWN', NOW() - INTERVAL '3 months'
FROM game g WHERE g.game_id::text IN ('fade0001-fade-fade-fade-fade00000001', 'fade0002-fade-fade-fade-fade00000002', 'fade0003-fade-fade-fade-fade00000003', 'fade0004-fade-fade-fade-fade00000004', 'fade0005-fade-fade-fade-fade00000005', 'fade0006-fade-fade-fade-fade00000006')
ON CONFLICT DO NOTHING;

INSERT INTO player_rating (rating_id, game_id, rater_id, ratee_id, rating, comment, is_flagged, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'fade0001-fade-fade-fade-fade00000001', '11111111-1111-1111-1111-111111111111', 'f902a50d-a613-4040-8fbf-8e7aab4c77e7', 5, 'Great player!', false, NOW(), NOW()),
    (gen_random_uuid(), 'fade0002-fade-fade-fade-fade00000002', '22222222-2222-2222-2222-222222222222', 'f902a50d-a613-4040-8fbf-8e7aab4c77e7', 4, 'Solid fundamentals.', false, NOW(), NOW()),
    (gen_random_uuid(), 'fade0003-fade-fade-fade-fade00000003', '33333333-3333-3333-3333-333333333333', 'f902a50d-a613-4040-8fbf-8e7aab4c77e7', 5, 'Hustles hard.', false, NOW(), NOW()),
    (gen_random_uuid(), 'fade0004-fade-fade-fade-fade00000004', '44444444-4444-4444-4444-444444444444', 'f902a50d-a613-4040-8fbf-8e7aab4c77e7', 4, 'Good game.', false, NOW(), NOW()),
    
    (gen_random_uuid(), 'fade0001-fade-fade-fade-fade00000001', '11111111-1111-1111-1111-111111111111', '5e0916b1-c174-4f3c-96ec-e044fa6f9a99', 5, 'Awesome teammate.', false, NOW(), NOW()),
    (gen_random_uuid(), 'fade0002-fade-fade-fade-fade00000002', '22222222-2222-2222-2222-222222222222', '5e0916b1-c174-4f3c-96ec-e044fa6f9a99', 3, 'Needs to pass more.', false, NOW(), NOW()),
    (gen_random_uuid(), 'fade0003-fade-fade-fade-fade00000003', '33333333-3333-3333-3333-333333333333', '5e0916b1-c174-4f3c-96ec-e044fa6f9a99', 5, 'Clutch shots!', false, NOW(), NOW()),
    (gen_random_uuid(), 'fade0004-fade-fade-fade-fade00000004', '44444444-4444-4444-4444-444444444444', '5e0916b1-c174-4f3c-96ec-e044fa6f9a99', 4, 'Very competitive.', false, NOW(), NOW())
ON CONFLICT DO NOTHING;
