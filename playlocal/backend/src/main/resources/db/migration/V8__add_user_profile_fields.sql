-- V8: Add profile fields to user table
-- Adds bio, location, and availability columns for user profile data

ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS bio VARCHAR(500),
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS availability VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN "user".bio IS 'User bio/description for their profile';
COMMENT ON COLUMN "user".location IS 'User location (city/region)';
COMMENT ON COLUMN "user".availability IS 'User availability preferences (comma-separated: WEEKDAYS,WEEKENDS,MORNINGS,etc)';
