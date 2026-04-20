-- Ensure display_name is not unique.
-- This migration protects environments that may have drifted schema
-- (manual indexes/constraints or legacy artifacts) enforcing uniqueness.

DO $$
DECLARE
    idx RECORD;
    cst RECORD;
BEGIN
    -- Drop any UNIQUE indexes on user(display_name)
    FOR idx IN
        SELECT i.indexname
        FROM pg_indexes i
        WHERE i.schemaname = current_schema()
          AND i.tablename = 'user'
          AND i.indexdef ILIKE 'CREATE UNIQUE INDEX%'
          AND i.indexdef ILIKE '%(display_name%'
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I', idx.indexname);
    END LOOP;

    -- Drop any UNIQUE constraints involving display_name
    FOR cst IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'user'
          AND nsp.nspname = current_schema()
          AND con.contype = 'u'
          AND pg_get_constraintdef(con.oid) ILIKE '%display_name%'
    LOOP
        EXECUTE format('ALTER TABLE "user" DROP CONSTRAINT IF EXISTS %I', cst.conname);
    END LOOP;
END
$$;

-- Enforce display_name as non-null.
-- Backfill any null/blank values before applying NOT NULL.
UPDATE "user"
SET display_name = COALESCE(NULLIF(TRIM(display_name), ''), SPLIT_PART(email, '@', 1))
WHERE display_name IS NULL OR TRIM(display_name) = '';

ALTER TABLE "user"
    ALTER COLUMN display_name SET NOT NULL;