-- NGX GENESIS V3 - Security Hardening Migration
-- Migration: 003_security_hardening
--
-- This migration:
-- Replaces permissive RLS policies with strict ones based on auth.uid()

-- ============================================================================
-- STEP 1: Hardening sessions
-- ============================================================================
DROP POLICY IF EXISTS sessions_policy ON sessions;
CREATE POLICY sessions_policy ON sessions
    FOR ALL
    TO authenticated
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- STEP 2: Hardening user_profiles
-- ============================================================================
DROP POLICY IF EXISTS user_profiles_policy ON user_profiles;
CREATE POLICY user_profiles_policy ON user_profiles
    FOR ALL
    TO authenticated
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- STEP 3: Hardening conversation_messages
-- ============================================================================
DROP POLICY IF EXISTS messages_policy ON conversation_messages;
CREATE POLICY messages_policy ON conversation_messages
    FOR ALL
    TO authenticated
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- STEP 4: Hardening routing_history
-- ============================================================================
DROP POLICY IF EXISTS routing_policy ON routing_history;
CREATE POLICY routing_policy ON routing_history
    FOR ALL
    TO authenticated
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- STEP 5: Hardening wearable_connections
-- ============================================================================
DROP POLICY IF EXISTS wearable_connections_policy ON wearable_connections;
CREATE POLICY wearable_connections_policy ON wearable_connections
    FOR ALL
    TO authenticated
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- STEP 6: Hardening wearable_data
-- ============================================================================
DROP POLICY IF EXISTS wearable_data_policy ON wearable_data;
CREATE POLICY wearable_data_policy ON wearable_data
    FOR ALL
    TO authenticated
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- STEP 7: Hardening wearable_raw
-- ============================================================================
DROP POLICY IF EXISTS wearable_raw_policy ON wearable_raw;
CREATE POLICY wearable_raw_policy ON wearable_raw
    FOR ALL
    TO authenticated
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- STEP 8: Grant service_role access (bypass RLS for internal sync)
-- ============================================================================
-- Supabase service_role automatically bypasses RLS, but explicitly stating
-- that these policies are for 'authenticated' (users) ensures security.
