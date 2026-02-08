-- Fix enum-backed columns accidentally created as bytea

ALTER TABLE game
  ALTER COLUMN skill_band TYPE text
  USING skill_band::text;

ALTER TABLE game
  ALTER COLUMN indoor_outdoor TYPE text
  USING indoor_outdoor::text;

ALTER TABLE game
  ALTER COLUMN intensity_band TYPE text
  USING intensity_band::text;

ALTER TABLE sport
  ALTER COLUMN name TYPE text
  USING name::text;
