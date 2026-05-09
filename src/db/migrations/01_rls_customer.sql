-- =============================================
-- 1. CLEANUP 
-- =============================================
-- Remove existing policies to avoid duplicates
DROP POLICY IF EXISTS "RLS-Customer-Select" ON customer;
DROP POLICY IF EXISTS "RLS-Customer-Insert" ON customer;
DROP POLICY IF EXISTS "RLS-Customer-Update" ON customer;

-- Specify parameter types to solve the "function not unique" error
DROP FUNCTION IF EXISTS check_cms_right(varchar);
DROP FUNCTION IF EXISTS check_cms_right(text);

-- =============================================
-- 2. HELPER FUNCTION
-- =============================================
-- This function checks if the logged-in user has a specific permission
CREATE OR REPLACE FUNCTION check_cms_right(req_right_id VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "UserModule_Rights"
    WHERE "userId" = auth.uid()
    AND right_id = req_right_id 
    AND is_allowed = 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. ENABLE RLS
-- =============================================
ALTER TABLE customer ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. SELECT POLICY
-- =============================================
-- Logic: Regular users see 'ACTIVE' customers. 
-- Admins/Superadmins see everything (including 'INACTIVE').
CREATE POLICY "RLS-Customer-Select" ON customer
FOR SELECT TO authenticated
USING (
  (record_status = 'ACTIVE') 
  OR 
  (EXISTS (
      SELECT 1 FROM "user" 
      WHERE "userId" = auth.uid() 
      AND user_type IN ('ADMIN', 'SUPERADMIN')
  ))
);

-- =============================================
-- 5. INSERT POLICY
-- =============================================
-- Logic: Only users with the 'CUST_ADD' right in UserModule_Rights can insert.
CREATE POLICY "RLS-Customer-Insert" ON customer
FOR INSERT TO authenticated
WITH CHECK (check_cms_right('CUST_ADD'));

-- =============================================
-- 6. UPDATE POLICY
-- =============================================
-- Logic: 
-- 1. Must have 'CUST_EDIT' to change names/addresses.
-- 2. Must have 'CUST_DEL' to set record_status to 'INACTIVE'.
-- 3. Only ADMIN/SUPERADMIN can set status back to 'ACTIVE'.
CREATE POLICY "RLS-Customer-Update" ON customer
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (
  -- Scenario A: Soft Delete
  (record_status = 'INACTIVE' AND check_cms_right('CUST_DEL'))
  
  -- Scenario B: Reactivation (Restricted to Admins)
  OR (record_status = 'ACTIVE' AND (
      EXISTS (
          SELECT 1 FROM "user" 
          WHERE "userId" = auth.uid() 
          AND user_type IN ('ADMIN', 'SUPERADMIN')
      )
  ))
  
  -- Scenario C: General Editing
  OR (check_cms_right('CUST_EDIT'))
);
