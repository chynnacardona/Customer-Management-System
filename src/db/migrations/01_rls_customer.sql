-- 1. CLEANUP
DROP POLICY IF EXISTS "RLS-Customer-Select" ON customer;
DROP POLICY IF EXISTS "RLS-Customer-Insert" ON customer;
DROP POLICY IF EXISTS "RLS-Customer-Update" ON customer;
DROP FUNCTION IF EXISTS check_cms_right;

-- 2. HELPER FUNCTION (Uses native UUID for better performance)
CREATE OR REPLACE FUNCTION check_cms_right(req_right_id VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "UserModule_Rights"
    WHERE "userId" = auth.uid() -- Removed ::text cast
    AND right_id = req_right_id 
    AND is_allowed = 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ENABLE RLS
ALTER TABLE customer ENABLE ROW LEVEL SECURITY;

-- 4. SELECT: Users see ACTIVE, Admins see EVERYTHING
CREATE POLICY "RLS-Customer-Select" ON customer
FOR SELECT TO authenticated
USING (
  (record_status = 'ACTIVE') 
  OR 
  (EXISTS (SELECT 1 FROM "user" WHERE "userId" = auth.uid() AND user_type IN ('ADMIN', 'SUPERADMIN')))
);

-- 5. INSERT: Must have CUST_ADD right
CREATE POLICY "RLS-Customer-Insert" ON customer
FOR INSERT TO authenticated
WITH CHECK (check_cms_right('CUST_ADD'));

-- 6. UPDATE: Complex logic for editing vs deleting
CREATE POLICY "RLS-Customer-Update" ON customer
FOR UPDATE TO authenticated
USING (true) -- Allows the attempt; WITH CHECK handles the permission
WITH CHECK (
  -- Perm 1: Soft Delete (Setting to INACTIVE)
  (record_status = 'INACTIVE' AND check_cms_right('CUST_DEL'))
  
  -- Perm 2: Reactivation (Admins only)
  OR (record_status = 'ACTIVE' AND (EXISTS (SELECT 1 FROM "user" WHERE "userId" = auth.uid() AND user_type IN ('ADMIN', 'SUPERADMIN'))))
  
  -- Perm 3: Standard Edit
  OR (check_cms_right('CUST_EDIT'))
);
