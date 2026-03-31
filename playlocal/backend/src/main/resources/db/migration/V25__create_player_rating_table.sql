CREATE TABLE player_rating (
    rating_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL,
    rater_id UUID NOT NULL,
    ratee_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment VARCHAR(500),
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_player_rating_game FOREIGN KEY (game_id) REFERENCES game (game_id),
    CONSTRAINT fk_player_rating_rater FOREIGN KEY (rater_id) REFERENCES "user" (user_id),
    CONSTRAINT fk_player_rating_ratee FOREIGN KEY (ratee_id) REFERENCES "user" (user_id),
    CONSTRAINT unique_player_rating UNIQUE (game_id, rater_id, ratee_id)
);
