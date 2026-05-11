CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id TEXT NOT NULL,
    actor_email TEXT,
    actor_role VARCHAR(20) NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_insert_authenticated
ON audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
    actor_user_id = auth.uid()::text
    AND actor_role IN ('USER', 'ADMIN')
    AND EXISTS (
        SELECT 1
        FROM public."user" u
        WHERE u."userId" = auth.uid()
          AND u.user_type = actor_role
          AND u.record_status = 'ACTIVE'
    )
);

CREATE POLICY audit_logs_select_superadmin
ON audit_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public."user" u
        WHERE u."userId" = auth.uid()
          AND u.user_type = 'SUPERADMIN'
          AND u.record_status = 'ACTIVE'
    )
);

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
