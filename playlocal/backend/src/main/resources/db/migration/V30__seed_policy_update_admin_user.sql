-- Seed a dedicated admin account for privacy-policy update controls.
-- Login password for this seeded account: password123
-- The bcrypt hash below matches the same local-dev password used by demo users.

WITH existing_user AS (
    SELECT user_id
    FROM "user"
    WHERE LOWER(email) = LOWER('playlocal.mgdfd@simplelogin.com')
), inserted_user AS (
    INSERT INTO "user" (
        email,
        password_hash,
        display_name,
        slug,
        status,
        reliability_score,
        attended_count,
        no_show_count,
        games_count,
        age_confirmed_at,
        created_at,
        updated_at,
        mfa_enabled
    )
    SELECT
        'playlocal.mgdfd@simplelogin.com',
        '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq',
        'PlayLocal Policy Admin',
        'playlocal-policy-admin',
        'ACTIVE',
        100.0,
        0,
        0,
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        FALSE
    WHERE NOT EXISTS (SELECT 1 FROM existing_user)
    RETURNING user_id
), target_user AS (
    SELECT user_id FROM existing_user
    UNION ALL
    SELECT user_id FROM inserted_user
)
INSERT INTO user_role (user_id, role_id, granted_at)
SELECT tu.user_id, r.role_id, CURRENT_TIMESTAMP
FROM target_user tu
JOIN role r ON r.name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

WITH target_user AS (
    SELECT user_id
    FROM "user"
    WHERE LOWER(email) = LOWER('playlocal.mgdfd@simplelogin.com')
)
INSERT INTO user_privacy_settings (
    user_id,
    profile_visibility_id,
    skills_visibility_id,
    history_visibility_id,
    media_default_visibility_id,
    location_visibility_rule_id,
    allow_profile_search,
    updated_at
)
SELECT
    tu.user_id,
    (SELECT content_visibility_id FROM content_visibility WHERE code = 'public' LIMIT 1),
    (SELECT content_visibility_id FROM content_visibility WHERE code = 'public' LIMIT 1),
    (SELECT content_visibility_id FROM content_visibility WHERE code = 'friends' LIMIT 1),
    (SELECT content_visibility_id FROM content_visibility WHERE code = 'participants' LIMIT 1),
    (SELECT location_visibility_rule_id FROM location_visibility_rule WHERE code = 'confirmed_only' LIMIT 1),
    TRUE,
    CURRENT_TIMESTAMP
FROM target_user tu
ON CONFLICT (user_id) DO NOTHING;

-- Ensure this specific admin account is always loginable with password123,
-- even if the user already existed before this migration.
UPDATE "user"
SET
    password_hash = '$2a$10$iCQPGQhQSssocFVEH6kLt.UmeFazgIk555WFzAzLIg5yrFSb3/Inq',
    status = 'ACTIVE',
    deleted_at = NULL,
    mfa_enabled = FALSE,
    updated_at = CURRENT_TIMESTAMP
WHERE LOWER(email) = LOWER('playlocal.mgdfd@simplelogin.com');