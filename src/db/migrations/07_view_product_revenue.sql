DROP VIEW IF EXISTS product_revenue CASCADE;

CREATE OR REPLACE VIEW product_revenue AS
SELECT
    p.prodcode,
    p.description,
    p.unit,
    COALESCE(SUM(sd.quantity), 0) AS total_qty_sold,
    COALESCE(SUM(sd.quantity * pcp.unitprice), 0) AS total_revenue
FROM product p
LEFT JOIN salesdetail sd ON sd.prodcode = p.prodcode
LEFT JOIN product_current_price pcp ON pcp.prodcode = p.prodcode
GROUP BY p.prodcode, p.description, p.unit
ORDER BY total_revenue DESC;

GRANT SELECT ON product_revenue TO authenticated;
