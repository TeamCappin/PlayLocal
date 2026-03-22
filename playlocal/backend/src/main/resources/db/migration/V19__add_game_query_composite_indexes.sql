-- Add composite indexes for the most common game query access patterns.
-- These queries already filter on status together with a time column,
-- so separate single-column indexes force the planner to do extra work.

CREATE INDEX idx_game_status_start_time
    ON game(status, start_time);

CREATE INDEX idx_game_status_end_time
    ON game(status, end_time)
    WHERE end_time IS NOT NULL;
