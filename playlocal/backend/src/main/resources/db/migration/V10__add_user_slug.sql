-- V10: Add slug column to user table for URL-friendly profile lookups
-- Slug is derived from display_name and must be unique for active users

-- First, fix any existing users that have NULL status (demo data from V9)
UPDATE "user" SET status = 'ACTIVE' WHERE status IS NULL AND deleted_at IS NULL;

-- Add nullable slug column first
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Populate slugs for existing users (convert display_name to URL-friendly slug)
UPDATE "user" 
SET slug = LOWER(
    TRIM(
        BOTH '-' FROM 
        REGEXP_REPLACE(
            REGEXP_REPLACE(display_name, '[^a-zA-Z0-9]+', '-', 'g'),
            '-+', '-', 'g'
        )
    )
)
WHERE slug IS NULL AND display_name IS NOT NULL;

-- Handle users without display_name by using part of their user_id
UPDATE "user"
SET slug = 'user-' || SUBSTRING(CAST(user_id AS VARCHAR), 1, 8)
WHERE slug IS NULL;

-- Make slug NOT NULL after population
ALTER TABLE "user" ALTER COLUMN slug SET NOT NULL;

-- Add unique index for active (non-deleted) users only
-- This allows soft-deleted users to have duplicate slugs
CREATE UNIQUE INDEX IF NOT EXISTS ux_user_slug_active 
ON "user"(slug) 
WHERE deleted_at IS NULL;

-- Add index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_user_slug ON "user"(slug);
