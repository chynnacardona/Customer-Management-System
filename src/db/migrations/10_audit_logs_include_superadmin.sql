-- Extend audit log insert policy so SUPERADMIN activity is captured too.
DROP POLICY IF EXISTS audit_logs_insert_authenticated ON audit_logs;

CREATE POLICY audit_logs_insert_authenticated
ON audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
    actor_user_id = auth.uid()::text
    AND actor_role IN ('USER', 'ADMIN', 'SUPERADMIN')
    AND EXISTS (
        SELECT 1
        FROM public."user" u
        WHERE u."userId" = auth.uid()
          AND u.user_type = actor_role
          AND u.record_status = 'ACTIVE'
    )
);
