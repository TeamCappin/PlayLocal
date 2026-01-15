CREATE TABLE IF NOT EXISTS chat_room (
                                         room_id     UUID PRIMARY KEY,
                                         game_id     UUID NOT NULL UNIQUE,
                                         created_at  TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_message (
                                            message_id      UUID PRIMARY KEY,
                                            room_id         UUID NOT NULL REFERENCES chat_room(room_id) ON DELETE CASCADE,
    game_id         UUID NOT NULL,
    sender_id       UUID NOT NULL,
    sender_name     VARCHAR(120),
    message_text    TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL,
    deleted_at      TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_chat_message_room_created
    ON chat_message(room_id, created_at);
