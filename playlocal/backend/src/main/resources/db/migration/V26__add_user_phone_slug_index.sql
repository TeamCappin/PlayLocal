-- Add a partial index for user phone lookups.
-- Phone numbers remain non-unique; this only supports faster queries on active users.
CREATE INDEX idx_user_phone_e164_active
    ON "user" (phone_e164)
    WHERE deleted_at IS NULL AND phone_e164 IS NOT NULL;

-- Remove any partial unique index on slug
DO $$
DECLARE
    idx RECORD;
BEGIN
    FOR idx IN
        SELECT i.indexname
        FROM pg_indexes i
        WHERE i.schemaname = current_schema()
          AND i.tablename = 'user'
          AND i.indexdef ILIKE 'CREATE UNIQUE INDEX%'
          AND i.indexdef ILIKE '%(slug%'
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I', idx.indexname);
    END LOOP;
END
$$;

-- Add a global unique constraint on slug
ALTER TABLE "user"
    ADD CONSTRAINT user_slug_unique UNIQUE (slug);