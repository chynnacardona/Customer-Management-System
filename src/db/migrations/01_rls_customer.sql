-- 1. REFRESH HELPER
CREATE OR REPLACE FUNCTION check_cms_right(req_right_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM usermodule_rights
    WHERE "userId"::text = auth.uid()::text 
    AND right_id = req_right_id 
    AND is_allowed = 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ENABLE RLS
ALTER TABLE customer ENABLE ROW LEVEL SECURITY;

-- SELECT POLICY
-- ADMIN/SUPERADMIN see all. USER sees only ACTIVE + needs CUST_VIEW=1.
DROP POLICY IF EXISTS "customer_select_policy" ON customer;
CREATE POLICY "customer_select_policy" ON customer FOR SELECT TO authenticated
USING (
  (SELECT user_type FROM "user" WHERE "userId"::text = auth.uid()::text) IN ('ADMIN', 'SUPERADMIN')
  OR 
  ((SELECT user_type FROM "user" WHERE "userId"::text = auth.uid()::text) = 'USER' 
    AND record_status = 'ACTIVE' 
    AND check_cms_right('CUST_VIEW'))
);

-- INSERT POLICY
-- SUPERADMIN/ADMIN can add. USER cannot (check_cms_right will be 0).
DROP POLICY IF EXISTS "customer_insert_policy" ON customer;
CREATE POLICY "customer_insert_policy" ON customer FOR INSERT TO authenticated
WITH CHECK (
  ((SELECT user_type FROM "user" WHERE "userId"::text = auth.uid()::text) = 'SUPERADMIN' AND check_cms_right('CUST_ADD'))
  OR
  ((SELECT user_type FROM "user" WHERE "userId"::text = auth.uid()::text) = 'ADMIN' AND check_cms_right('CUST_ADD'))
);

-- UPDATE POLICY
-- SUPERADMIN: Edit/recover with CUST_EDIT and soft-delete with CUST_DEL.
-- ADMIN: Edit/recover ACTIVE rows with CUST_EDIT, but cannot set records to INACTIVE.
-- USER: Blocked.
DROP POLICY IF EXISTS "customer_update_policy" ON customer;
CREATE POLICY "customer_update_policy" ON customer FOR UPDATE TO authenticated
USING (
  (SELECT user_type FROM "user" WHERE "userId"::text = auth.uid()::text) IN ('ADMIN', 'SUPERADMIN')
  AND (check_cms_right('CUST_EDIT') OR check_cms_right('CUST_DEL'))
)
WITH CHECK (
  -- SUPERADMIN Logic
  ((SELECT user_type FROM "user" WHERE "userId"::text = auth.uid()::text) = 'SUPERADMIN' 
    AND (
      (record_status = 'INACTIVE' AND check_cms_right('CUST_DEL'))
      OR
      (record_status = 'ACTIVE' AND check_cms_right('CUST_EDIT'))
    ))
  
  OR 
  
  -- ADMIN Logic
  ((SELECT user_type FROM "user" WHERE "userId"::text = auth.uid()::text) = 'ADMIN' 
    AND check_cms_right('CUST_EDIT') 
    AND record_status = 'ACTIVE') -- Prevents ADMIN from setting status to INACTIVE
);
