-- 1. CLEANUP
-- This ensures the script can be re-run without "policy already exists" errors
DROP POLICY IF EXISTS "RLS-Sales-Select-Only" ON sales;
DROP POLICY IF EXISTS "RLS-SalesDetail-Select-Only" ON salesdetail;
DROP POLICY IF EXISTS "RLS-Product-Select-Only" ON product;
DROP POLICY IF EXISTS "RLS-PriceHist-Select-Only" ON pricehist;

-- 2. ENABLE RLS
-- This "locks the door" for all operations
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesdetail ENABLE ROW LEVEL SECURITY;
ALTER TABLE product ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricehist ENABLE ROW LEVEL SECURITY;

-- 3. CREATE SELECT-ONLY POLICIES
-- This "opens the window" for viewing only
CREATE POLICY "RLS-Sales-Select-Only" ON sales 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "RLS-SalesDetail-Select-Only" ON salesdetail 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "RLS-Product-Select-Only" ON product 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "RLS-PriceHist-Select-Only" ON pricehist 
  FOR SELECT TO authenticated USING (true);
