-- 1. Cleanup
DROP VIEW IF EXISTS product_current_price CASCADE;

-- 2. Create View
-- Removing quotes from pricehist and prodcode to match your lowercase schema
CREATE OR REPLACE VIEW product_current_price AS
SELECT DISTINCT ON (prodcode)
    prodcode,
    unitprice,
    effdate
FROM pricehist
ORDER BY prodcode, effdate DESC;

-- 3. Permissions
GRANT SELECT ON product_current_price TO authenticated;
