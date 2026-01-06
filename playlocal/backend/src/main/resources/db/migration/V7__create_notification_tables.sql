-- PlayLocal Database Schema V7: Notification, Chat, Analytics Tables
-- Implements: notification, chat_room, chat_message, announcement, weather, analytics

-- =============================================
-- NOTIFICATIONS
-- =============================================

CREATE TABLE notification (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(user_id),
    channel notification_channel NOT NULL DEFAULT 'IN_APP',
    notif_type VARCHAR(50) NOT NULL,  -- 'game_reminder', 'attendance_prompt', 'friend_request', etc.
    payload_json JSONB,  -- structured notification data
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    status notification_status NOT NULL DEFAULT 'PENDING',
    provider_message_id VARCHAR(100)  -- external provider reference (SendGrid, etc.)
);

CREATE INDEX idx_notification_user ON notification(user_id);
CREATE INDEX idx_notification_status ON notification(status);
CREATE INDEX idx_notification_scheduled ON notification(scheduled_for) WHERE status = 'pending';

-- =============================================
-- CHAT (Deferred for MVP, but structure in place)
-- Note: MongoDB recommended for production, this is relational fallback
-- =============================================

CREATE TABLE chat_room (
    room_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES game(game_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- One room per game
    CONSTRAINT uq_chat_room_game UNIQUE (game_id),
    -- Required for composite FK from messages
    CONSTRAINT uq_chat_room UNIQUE (room_id, game_id)
);

CREATE TABLE chat_message (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL,
    game_id UUID NOT NULL,  -- denormalized for composite FK
    sender_participation_id UUID NOT NULL,
    message_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,  -- soft delete for moderation
    
    -- Participants-only pattern (trigger-free)
    CONSTRAINT fk_message_room FOREIGN KEY (room_id, game_id) 
        REFERENCES chat_room(room_id, game_id),
    CONSTRAINT fk_message_sender FOREIGN KEY (game_id, sender_participation_id)
        REFERENCES game_participation(game_id, participation_id)
);

CREATE INDEX idx_chat_message_room ON chat_message(room_id);
CREATE INDEX idx_chat_message_created ON chat_message(created_at);

-- =============================================
-- ANNOUNCEMENTS (Organizer broadcasts)
-- =============================================

CREATE TABLE announcement (
    announcement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES game(game_id),
    created_by_participation_id UUID NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Participants-only (organizer role enforced at app layer)
    CONSTRAINT fk_announcement_creator FOREIGN KEY (game_id, created_by_participation_id)
        REFERENCES game_participation(game_id, participation_id)
);

CREATE INDEX idx_announcement_game ON announcement(game_id);

-- =============================================
-- WEATHER SNAPSHOTS (for outdoor games)
-- =============================================

CREATE TABLE weather_snapshot (
    weather_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES game(game_id),
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    provider VARCHAR(50),  -- 'openweathermap', 'weatherapi', etc.
    summary VARCHAR(255),
    data_json JSONB,  -- full weather data
    risk_flags_json JSONB  -- extracted risk indicators
);

CREATE INDEX idx_weather_game ON weather_snapshot(game_id);

-- =============================================
-- ANALYTICS EVENTS
-- =============================================

CREATE TABLE analytics_event (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES "user"(user_id),
    game_id UUID REFERENCES game(game_id),
    event_name VARCHAR(100) NOT NULL,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    properties_json JSONB,
    session_id VARCHAR(100)
);

CREATE INDEX idx_analytics_user ON analytics_event(user_id);
CREATE INDEX idx_analytics_event_name ON analytics_event(event_name);
CREATE INDEX idx_analytics_occurred ON analytics_event(occurred_at);

-- =============================================
-- GRANT DEFAULT ROLE TO NEW USERS (Trigger)
-- =============================================

CREATE OR REPLACE FUNCTION grant_default_user_role()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    SELECT role_id INTO default_role_id FROM role WHERE name = 'user';
    INSERT INTO user_role (user_id, role_id, granted_at)
    VALUES (NEW.user_id, default_role_id, CURRENT_TIMESTAMP);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_grant_default_role
    AFTER INSERT ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION grant_default_user_role();
