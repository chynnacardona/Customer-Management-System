-- 1. REFRESH HELPER FUNCTION
-- Must be SECURITY DEFINER to bypass RLS when checking rights
CREATE OR REPLACE FUNCTION check_cms_right(req_right_id VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM usermodule_rights
    WHERE "userId" = auth.uid() 
    AND right_id = req_right_id 
    AND is_allowed = 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. APPLY POLICIES
ALTER TABLE customer ENABLE ROW LEVEL SECURITY;

-- SELECT: USER sees ACTIVE only, ADMIN/SUPERADMIN see all rows
DROP POLICY IF EXISTS "customer_select_policy" ON customer;
CREATE POLICY "customer_select_policy" ON customer FOR SELECT TO authenticated
USING (
  (record_status = 'ACTIVE' AND check_cms_right('CUST_VIEW')) OR 
  (EXISTS (SELECT 1 FROM "user" WHERE "userId" = auth.uid() AND user_type IN ('ADMIN', 'SUPERADMIN')))
);

-- INSERT: Requires CUST_ADD = 1 (Blocked for USER by default)
DROP POLICY IF EXISTS "customer_insert_policy" ON customer;
CREATE POLICY "customer_insert_policy" ON customer FOR INSERT TO authenticated
WITH CHECK (check_cms_right('CUST_ADD'));

-- UPDATE: Handled by specific right requirements
DROP POLICY IF EXISTS "customer_update_policy" ON customer;
CREATE POLICY "customer_update_policy" ON customer FOR UPDATE TO authenticated
USING (true)
WITH CHECK (
  -- 1. Edit Right: Allows modifying data if record is active
  (check_cms_right('CUST_EDIT') AND record_status = 'ACTIVE') OR
  
  -- 2. Delete Right: Allows setting status to INACTIVE (SUPERADMIN ONLY)
  (check_cms_right('CUST_DEL') AND record_status = 'INACTIVE') OR
  
  -- 3. Recovery: Allows setting status to ACTIVE (ADMIN/SUPERADMIN ONLY)
  (record_status = 'ACTIVE' AND EXISTS (SELECT 1 FROM "user" WHERE "userId" = auth.uid() AND user_type IN ('ADMIN', 'SUPERADMIN')))
);
