-- Product Revenue View
CREATE OR REPLACE VIEW product_revenue AS
SELECT 
    p.prodcode,
    p.description,
    p.unit,
    SUM(sd.quantity) AS total_units_sold,
    COALESCE(SUM(sd.quantity * pcp.unitprice), 0) AS total_revenue
FROM product p
LEFT JOIN salesdetail sd ON p.prodcode = sd.prodcode
LEFT JOIN product_current_price pcp ON p.prodcode = pcp.prodcode
GROUP BY p.prodcode, p.description, p.unit
ORDER BY total_revenue DESC;

-- Grant access to the application role
GRANT SELECT ON product_revenue TO authenticated;
