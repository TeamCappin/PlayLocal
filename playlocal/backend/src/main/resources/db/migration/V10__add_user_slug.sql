-- V10: Add slug column to user table for URL-friendly profile navigation
-- US-1.3: Privacy Defaults - Slug-based profile access

-- Add slug column (nullable initially for existing data)
ALTER TABLE "user" ADD COLUMN slug VARCHAR(255);

-- Create unique index for slug lookups
CREATE UNIQUE INDEX idx_user_slug ON "user"(slug) WHERE deleted_at IS NULL;

-- Populate slug for existing users based on display_name
UPDATE "user" 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(display_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL AND display_name IS NOT NULL;

-- Handle duplicates by appending row number
WITH duplicates AS (
    SELECT user_id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
    FROM "user"
    WHERE slug IS NOT NULL AND deleted_at IS NULL
)
UPDATE "user" u
SET slug = u.slug || '-' || d.rn
FROM duplicates d
WHERE u.user_id = d.user_id AND d.rn > 1;

-- Make slug NOT NULL after population
ALTER TABLE "user" ALTER COLUMN slug SET NOT NULL;
