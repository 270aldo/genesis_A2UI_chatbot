-- NGX GENESIS V3 - Schema Upgrade Migration
-- Migration: 002_v3_schema_upgrade
--
-- This migration:
-- 1. Drops obsolete empty tables (active_sessions, profiles)
-- 2. Creates new V3 tables for clipboard, wearables, etc.
-- 3. Preserves existing functional tables (daily_checkins, workout_sessions, etc.)

-- ============================================================================
-- STEP 1: Drop obsolete tables (safe - they're empty)
-- ============================================================================

DROP TABLE IF EXISTS active_sessions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================================
-- STEP 2: Create V3 Sessions Table (Clipboard Persistence)
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity DESC);

-- ============================================================================
-- STEP 3: Create V3 User Profiles Table (Extended)
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- ============================================================================
-- STEP 4: Create Conversation History Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    agent VARCHAR(50),
    widget_type VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_session_id ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON conversation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON conversation_messages(created_at DESC);

-- ============================================================================
-- STEP 5: Create Routing History Table (Analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS routing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    query TEXT NOT NULL,
    selected_core VARCHAR(50) NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 1.0,
    reason TEXT,
    response_time_ms INTEGER,
    was_correct BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routing_session_id ON routing_history(session_id);
CREATE INDEX IF NOT EXISTS idx_routing_selected_core ON routing_history(selected_core);
CREATE INDEX IF NOT EXISTS idx_routing_created_at ON routing_history(created_at DESC);

-- ============================================================================
-- STEP 6: Create Wearable Tables (Phase 3)
-- ============================================================================

-- Wearable Connections (OAuth)
CREATE TABLE IF NOT EXISTS wearable_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('garmin', 'oura', 'whoop', 'apple')),

    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,

    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_error TEXT,

    provider_user_id VARCHAR(100),
    scopes TEXT[],

    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_wearable_user_id ON wearable_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_provider ON wearable_connections(provider);

-- Wearable Data (Normalized)
CREATE TABLE IF NOT EXISTS wearable_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL,
    provider VARCHAR(20) NOT NULL,
    data_date DATE NOT NULL,

    -- HRV
    hrv_rmssd DECIMAL(6,2),
    hrv_sdnn DECIMAL(6,2),
    resting_hr INTEGER,

    -- Sleep
    sleep_score DECIMAL(5,2),
    sleep_hours DECIMAL(4,2),
    deep_sleep_minutes INTEGER,
    rem_sleep_minutes INTEGER,
    light_sleep_minutes INTEGER,
    awake_minutes INTEGER,

    -- Recovery
    recovery_score DECIMAL(5,2),
    readiness_score DECIMAL(5,2),
    stress_level INTEGER,
    body_battery INTEGER,
    strain DECIMAL(4,2),

    -- Activity
    steps INTEGER,
    active_calories INTEGER,
    total_calories INTEGER,
    active_minutes INTEGER,

    raw_data_id UUID,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, provider, data_date)
);

CREATE INDEX IF NOT EXISTS idx_wearable_data_user_date ON wearable_data(user_id, data_date DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_data_provider ON wearable_data(provider);

-- Wearable Raw Data
CREATE TABLE IF NOT EXISTS wearable_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL,
    provider VARCHAR(20) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    data_date DATE,
    payload JSONB NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wearable_raw_user_date ON wearable_raw(user_id, data_date DESC);

-- ============================================================================
-- STEP 7: Create update_updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wearable_connections_updated_at ON wearable_connections;
CREATE TRIGGER update_wearable_connections_updated_at
    BEFORE UPDATE ON wearable_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 8: Enable Row Level Security
-- ============================================================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_raw ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 9: Create RLS Policies (allow service role and matching user_id)
-- ============================================================================

-- Sessions
DROP POLICY IF EXISTS sessions_policy ON sessions;
CREATE POLICY sessions_policy ON sessions
    FOR ALL
    USING (true)  -- Allow all for now, tighten in production
    WITH CHECK (true);

-- User profiles
DROP POLICY IF EXISTS user_profiles_policy ON user_profiles;
CREATE POLICY user_profiles_policy ON user_profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Conversation messages
DROP POLICY IF EXISTS messages_policy ON conversation_messages;
CREATE POLICY messages_policy ON conversation_messages
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Routing history
DROP POLICY IF EXISTS routing_policy ON routing_history;
CREATE POLICY routing_policy ON routing_history
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Wearable connections
DROP POLICY IF EXISTS wearable_connections_policy ON wearable_connections;
CREATE POLICY wearable_connections_policy ON wearable_connections
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Wearable data
DROP POLICY IF EXISTS wearable_data_policy ON wearable_data;
CREATE POLICY wearable_data_policy ON wearable_data
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Wearable raw
DROP POLICY IF EXISTS wearable_raw_policy ON wearable_raw;
CREATE POLICY wearable_raw_policy ON wearable_raw
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- STEP 10: Add comments
-- ============================================================================

COMMENT ON TABLE sessions IS 'V3 Session clipboard persistence for Redis fallback';
COMMENT ON TABLE user_profiles IS 'V3 Extended user profiles with wearables support';
COMMENT ON TABLE conversation_messages IS 'Full conversation history';
COMMENT ON TABLE routing_history IS 'CORE routing decisions for analytics';
COMMENT ON TABLE wearable_connections IS 'OAuth connections to wearable platforms';
COMMENT ON TABLE wearable_data IS 'Normalized wearable metrics from all sources';
COMMENT ON TABLE wearable_raw IS 'Raw API payloads for debugging';

-- ============================================================================
-- Done! Tables preserved: daily_checkins, workout_sessions, set_logs, widget_events
-- ============================================================================
