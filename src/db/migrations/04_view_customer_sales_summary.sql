-- 1. Cleanup
DROP VIEW IF EXISTS customer_sales_summary CASCADE;

-- 2. Create View
-- Joins: customer -> sales -> salesdetail -> product_current_price
-- This covers the "total transactions + total spend" requirement
CREATE OR REPLACE VIEW customer_sales_summary AS
SELECT 
    c.custname,
    COUNT(DISTINCT s.transno) AS total_transactions,
    COALESCE(SUM(sd.quantity * pcp.unitprice), 0) AS total_spent
FROM customer c
LEFT JOIN sales s ON c.custno = s.custno
LEFT JOIN salesdetail sd ON s.transno = sd.transno
LEFT JOIN product_current_price pcp ON sd.prodcode = pcp.prodcode
GROUP BY c.custname
ORDER BY total_spent DESC;

-- 3. Permissions
GRANT SELECT ON customer_sales_summary TO authenticated;
