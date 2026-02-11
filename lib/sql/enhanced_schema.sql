-- =====================================================
-- Mini ATS - Enhanced Database Schema
-- Adds: notifications, interviews, audit logs, full-text search
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'candidate_applied',
        'stage_changed',
        'interview_scheduled',
        'interview_reminder',
        'offer_sent',
        'candidate_hired',
        'candidate_rejected'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    data JSONB,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created 
ON notifications(created_at DESC);

-- =====================================================
-- INTERVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes >= 15 AND duration_minutes <= 480),
    type TEXT NOT NULL CHECK (type IN ('phone', 'video', 'onsite', 'technical')),
    location TEXT,
    meeting_link TEXT,
    interviewers UUID[] DEFAULT ARRAY[]::uuid[],
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for interviews
CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job ON interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled ON interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

-- =====================================================
-- AUDIT LOGS TABLE (for security tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- =====================================================
-- FULL-TEXT SEARCH SETUP
-- =====================================================
-- Create a function to generate search vector for candidates
CREATE OR REPLACE FUNCTION candidates_search_vector()
RETURNS tsvector AS $$
BEGIN
    RETURN (
        setweight(to_tsvector('english', COALESCE(full_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(email, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(current_title, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(current_company, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(location, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(skills, ' '), '')), 'D') ||
        setweight(to_tsvector('english', COALESCE(notes, '')), 'D')
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add search vector column (run once, then uncomment)
-- ALTER TABLE candidates ADD COLUMN search_vector tsvector 
-- GENERATED ALWAYS AS (candidates_search_vector()) STORED;

-- Index for full-text search (run once, then uncomment)
-- CREATE INDEX IF NOT EXISTS idx_candidates_search 
-- ON candidates USING GIN(search_vector);

-- =====================================================
-- RLS POLICIES (Row Level Security)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- NOTIFICATIONS policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- INTERVIEWS policies
CREATE POLICY "Users can view their own interviews"
    ON interviews FOR SELECT
    USING (auth.uid() = customer_id);

CREATE POLICY "Users can create interviews"
    ON interviews FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own interviews"
    ON interviews FOR UPDATE
    USING (auth.uid() = customer_id)
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can delete their own interviews"
    ON interviews FOR DELETE
    USING (auth.uid() = customer_id);

-- ADMIN policies (for viewing all data)
CREATE POLICY "Admins can view all notifications"
    ON notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all interviews"
    ON interviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- AUDIT LOGS policies (admin only for viewing)
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true); -- Handled by application logic

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::profile_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log candidate stage changes
CREATE OR REPLACE FUNCTION public.handle_candidate_stage_change()
RETURNS TRIGGER AS $$
DECLARE
    old_stage TEXT;
    new_stage TEXT;
BEGIN
    old_stage := COALESCE(OLD.stage::TEXT, 'null');
    new_stage := COALESCE(NEW.stage::TEXT, 'null');
    
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
        -- Log to candidate_history
        INSERT INTO candidate_history (candidate_id, changed_by, from_stage, to_stage)
        VALUES (
            NEW.id,
            NEW.customer_id,
            OLD.stage,
            NEW.stage
        );
        
        -- Create notification
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            NEW.customer_id,
            'stage_changed',
            'Stage Updated',
            format('Candidate %s moved from %s to %s', NEW.full_name, old_stage, new_stage),
            jsonb_build_object(
                'candidate_id', NEW.id,
                'from_stage', OLD.stage,
                'to_stage', NEW.stage
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for candidate stage changes
DROP TRIGGER IF EXISTS candidate_stage_change_trigger ON candidates;
CREATE TRIGGER candidate_stage_change_trigger
    AFTER UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_candidate_stage_change();

-- =====================================================
-- SAMPLE DATA (Optional)
-- =====================================================

-- Insert sample notification templates
-- INSERT INTO notification_templates (name, type, subject, body, variables) VALUES
-- ('New Application', 'candidate_applied', 'New application for {{job_title}}', '...', ARRAY['job_title', 'candidate_name']),
-- ('Stage Change', 'stage_changed', 'Candidate status update', '...', ARRAY['candidate_name', 'old_stage', 'new_stage']);

-- =====================================================
-- UTILITY VIEWS
-- =====================================================

-- View for dashboard stats
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    COUNT(DISTINCT j.id) as job_count,
    COUNT(DISTINCT c.id) as candidate_count,
    COUNT(DISTINCT i.id) as interview_count,
    p.created_at
FROM profiles p
LEFT JOIN jobs j ON j.customer_id = p.id
LEFT JOIN candidates c ON c.customer_id = p.id
LEFT JOIN interviews i ON i.customer_id = p.id
GROUP BY p.id;

-- =====================================================
-- MIGRATION NOTES
-- =====================================================
/*
To apply this schema:

1. Run this file in Supabase SQL Editor
2. Update your TypeScript types to include new tables
3. Rebuild your application

Run migrations in order:
1. enhanced_schema.sql (this file)
2. seed_data.sql (if needed)
*/
