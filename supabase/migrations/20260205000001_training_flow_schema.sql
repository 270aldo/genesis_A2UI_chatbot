-- NGX GENESIS - Training Flow Schema Migration
-- Migration: 20260205000001_training_flow_schema
--
-- This migration:
-- 1. ALTERs existing workout_sessions table with new columns
-- 2. ALTERs existing set_logs table with new columns
-- 3. CREATEs new daily_stats table
-- 4. CREATEs new personal_records table
-- 5. Adds indexes, RLS policies, and triggers

-- ============================================================================
-- STEP 1: ALTER workout_sessions - ADD missing columns (safe with IF NOT EXISTS)
-- ============================================================================

ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS season_id UUID;
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS phase_week INT;
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS exercises JSONB DEFAULT '[]';
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS genesis_note TEXT;
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS duration_mins INT;
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Expand status to include 'planned' and 'skipped'
ALTER TABLE workout_sessions DROP CONSTRAINT IF EXISTS workout_sessions_status_check;
ALTER TABLE workout_sessions ADD CONSTRAINT workout_sessions_status_check
  CHECK (status IN ('planned', 'active', 'completed', 'skipped'));

-- ============================================================================
-- STEP 2: ALTER set_logs - ADD missing columns
-- ============================================================================

ALTER TABLE set_logs ADD COLUMN IF NOT EXISTS exercise_order INT DEFAULT 0;
ALTER TABLE set_logs ADD COLUMN IF NOT EXISTS logged_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE set_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- STEP 3: CREATE daily_stats table
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL,
    stat_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Training
    workouts_completed INT DEFAULT 0,
    total_volume_kg DECIMAL(10,2) DEFAULT 0,
    total_sets INT DEFAULT 0,
    total_reps INT DEFAULT 0,
    training_minutes INT DEFAULT 0,

    -- Streak
    streak_days INT DEFAULT 0,

    -- PRs hit today
    prs_today INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(user_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, stat_date DESC);

-- ============================================================================
-- STEP 4: CREATE personal_records table
-- ============================================================================

CREATE TABLE IF NOT EXISTS personal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL,
    exercise_name VARCHAR(100) NOT NULL,

    best_weight_kg DECIMAL(8,2),
    best_reps INT,
    best_volume DECIMAL(10,2),  -- weight_kg * reps
    best_estimated_1rm DECIMAL(8,2),

    achieved_at TIMESTAMPTZ DEFAULT now(),
    session_id UUID,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(user_id, exercise_name)
);

CREATE INDEX IF NOT EXISTS idx_personal_records_user ON personal_records(user_id);

-- ============================================================================
-- STEP 5: Add updated_at triggers for new tables
-- ============================================================================

-- Reuse existing update_updated_at_column() from migration 002

DROP TRIGGER IF EXISTS update_workout_sessions_updated_at ON workout_sessions;
CREATE TRIGGER update_workout_sessions_updated_at
    BEFORE UPDATE ON workout_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_stats_updated_at ON daily_stats;
CREATE TRIGGER update_daily_stats_updated_at
    BEFORE UPDATE ON daily_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personal_records_updated_at ON personal_records;
CREATE TRIGGER update_personal_records_updated_at
    BEFORE UPDATE ON personal_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 6: Enable RLS + permissive policies (matches existing pattern)
-- ============================================================================

ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_stats_policy ON daily_stats;
CREATE POLICY daily_stats_policy ON daily_stats
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS personal_records_policy ON personal_records;
CREATE POLICY personal_records_policy ON personal_records
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- STEP 7: Comments
-- ============================================================================

COMMENT ON TABLE daily_stats IS 'Aggregated daily training statistics per user';
COMMENT ON TABLE personal_records IS 'Personal bests per exercise per user';
COMMENT ON COLUMN workout_sessions.exercises IS 'JSONB array of exercise definitions for this session';
COMMENT ON COLUMN workout_sessions.genesis_note IS 'GENESIS coach note for the workout';
