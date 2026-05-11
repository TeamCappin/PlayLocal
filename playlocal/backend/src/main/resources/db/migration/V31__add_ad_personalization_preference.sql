-- Add ad_personalization_enabled column to user_privacy_settings
-- Default: TRUE (ads enabled by default per PIPEDA compliance strategy)
-- Users can opt-out via Settings toggle.

ALTER TABLE user_privacy_settings
ADD COLUMN ad_personalization_enabled BOOLEAN DEFAULT TRUE;

-- Ensure all existing rows have the default value
UPDATE user_privacy_settings
   SET ad_personalization_enabled = TRUE
 WHERE ad_personalization_enabled IS NULL;

-- Make column NOT NULL after setting defaults
ALTER TABLE user_privacy_settings
ALTER COLUMN ad_personalization_enabled SET NOT NULL;
