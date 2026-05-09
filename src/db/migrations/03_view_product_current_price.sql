DROP VIEW IF EXISTS product_current_price CASCADE;

CREATE OR REPLACE VIEW product_current_price AS
SELECT DISTINCT ON ("prodCode")
    "prodCode",
    "unitPrice",
    "effDate"
FROM "priceHist"
ORDER BY "prodCode", "effDate" DESC;

GRANT SELECT ON product_current_price TO authenticated;
