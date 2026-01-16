-- NGX GENESIS V3 - Clipboard Persistence Schema
-- Migration: 001_clipboard_schema
-- Supports: Session clipboard with Redis fallback

-- ============================================================================
-- Sessions Table (Clipboard Persistence)
-- ============================================================================
-- Primary storage for session state when Redis is unavailable or for recovery

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(64) UNIQUE NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    clipboard_data JSONB NOT NULL DEFAULT '{}',
    message_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'expired')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- User Profiles Table (V3 Extended)
-- ============================================================================
-- Extended profile for GENESIS V3 including wearables and preferences

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) UNIQUE NOT NULL,

    -- Basic info
    name VARCHAR(100),
    email VARCHAR(255),
    age INTEGER,
    gender VARCHAR(20),

    -- Fitness profile
    fitness_level VARCHAR(20) CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
    primary_goal VARCHAR(50),
    available_equipment TEXT[] DEFAULT '{}',
    injuries TEXT[] DEFAULT '{}',
    training_days_per_week INTEGER,

    -- Nutrition profile
    dietary_restrictions TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    calorie_target INTEGER,
    protein_target_g INTEGER,

    -- Health profile
    tracks_cycle BOOLEAN DEFAULT FALSE,

    -- Preferences
    preferred_language VARCHAR(10) DEFAULT 'es',
    voice_enabled BOOLEAN DEFAULT FALSE,
    notification_preferences JSONB DEFAULT '{}',

    -- Wearables
    connected_wearables TEXT[] DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Conversation History Table (Full Persistence)
-- ============================================================================
-- Complete conversation history (clipboard only keeps last 20)

CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(64) NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    agent VARCHAR(50),  -- Which CORE handled this (NULL for user messages)
    widget_type VARCHAR(50),  -- Widget generated (if any)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for conversation messages
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON conversation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON conversation_messages(created_at DESC);

-- ============================================================================
-- Routing History Table (Analytics)
-- ============================================================================
-- Track routing decisions for ML optimization

CREATE TABLE IF NOT EXISTS routing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    query TEXT NOT NULL,
    selected_core VARCHAR(50) NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 1.0,
    reason TEXT,
    response_time_ms INTEGER,
    was_correct BOOLEAN,  -- For feedback learning
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for routing history
CREATE INDEX IF NOT EXISTS idx_routing_session_id ON routing_history(session_id);
CREATE INDEX IF NOT EXISTS idx_routing_selected_core ON routing_history(selected_core);
CREATE INDEX IF NOT EXISTS idx_routing_created_at ON routing_history(created_at DESC);

-- ============================================================================
-- Wearable Connections Table (Phase 3)
-- ============================================================================
-- OAuth tokens and connection status for wearables

CREATE TABLE IF NOT EXISTS wearable_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('garmin', 'oura', 'whoop', 'apple')),

    -- OAuth tokens (encrypted in production)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,

    -- Connection status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_error TEXT,

    -- Provider-specific data
    provider_user_id VARCHAR(100),
    scopes TEXT[],

    -- Timestamps
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint: one connection per provider per user
    UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_wearable_user_id ON wearable_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_provider ON wearable_connections(provider);

CREATE TRIGGER update_wearable_connections_updated_at
    BEFORE UPDATE ON wearable_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Wearable Data Table (Phase 3)
-- ============================================================================
-- Normalized metrics from all wearable sources

CREATE TABLE IF NOT EXISTS wearable_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL,
    provider VARCHAR(20) NOT NULL,

    -- Date for this data
    data_date DATE NOT NULL,

    -- Normalized metrics
    hrv_rmssd DECIMAL(6,2),  -- Heart Rate Variability (ms)
    hrv_sdnn DECIMAL(6,2),   -- Alternative HRV metric
    resting_hr INTEGER,      -- Resting heart rate (bpm)

    -- Sleep metrics
    sleep_score DECIMAL(5,2),  -- 0-100
    sleep_hours DECIMAL(4,2),
    deep_sleep_minutes INTEGER,
    rem_sleep_minutes INTEGER,
    light_sleep_minutes INTEGER,
    awake_minutes INTEGER,

    -- Recovery/Readiness
    recovery_score DECIMAL(5,2),  -- 0-100
    readiness_score DECIMAL(5,2), -- 0-100
    stress_level INTEGER,  -- 1-10
    body_battery INTEGER,  -- 0-100 (Garmin)
    strain DECIMAL(4,2),   -- 0-21 (Whoop)

    -- Activity
    steps INTEGER,
    active_calories INTEGER,
    total_calories INTEGER,
    active_minutes INTEGER,

    -- Raw data reference
    raw_data_id UUID,

    -- Timestamps
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint: one entry per user per provider per date
    UNIQUE(user_id, provider, data_date)
);

CREATE INDEX IF NOT EXISTS idx_wearable_data_user_date ON wearable_data(user_id, data_date DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_data_provider ON wearable_data(provider);

-- ============================================================================
-- Wearable Raw Data Table (Phase 3)
-- ============================================================================
-- Original payloads from wearable APIs (for debugging/reprocessing)

CREATE TABLE IF NOT EXISTS wearable_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL,
    provider VARCHAR(20) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,  -- API endpoint that returned this data
    data_date DATE,
    payload JSONB NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wearable_raw_user_date ON wearable_raw(user_id, data_date DESC);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
-- Enable RLS for user data protection

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_raw ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own data
-- Note: In production, configure these based on your auth setup

-- Sessions policy (service role bypass for backend)
CREATE POLICY sessions_user_policy ON sessions
    FOR ALL
    USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- User profiles policy
CREATE POLICY profiles_user_policy ON user_profiles
    FOR ALL
    USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- Messages policy
CREATE POLICY messages_user_policy ON conversation_messages
    FOR ALL
    USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- Wearable data policy
CREATE POLICY wearable_user_policy ON wearable_data
    FOR ALL
    USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE sessions IS 'Session clipboard persistence for Redis fallback';
COMMENT ON TABLE user_profiles IS 'Extended user profiles for GENESIS V3';
COMMENT ON TABLE conversation_messages IS 'Full conversation history (clipboard keeps last 20)';
COMMENT ON TABLE routing_history IS 'CORE routing decisions for analytics and ML';
COMMENT ON TABLE wearable_connections IS 'OAuth connections to wearable platforms';
COMMENT ON TABLE wearable_data IS 'Normalized wearable metrics from all sources';
COMMENT ON TABLE wearable_raw IS 'Raw API payloads for debugging/reprocessing';
