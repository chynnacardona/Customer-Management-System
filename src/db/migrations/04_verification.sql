SELECT COUNT(*) AS customerCount
FROM customer;

SELECT COUNT(*) AS salesCount
FROM sales;

SELECT COUNT(*) AS salesDetailCount
FROM salesDetail;

SELECT COUNT(*) AS productCount
FROM product;

SELECT COUNT(*) AS priceHistCount
FROM priceHist;

SELECT s.transNo, s.custNo 
FROM sales s
LEFT JOIN customer c ON s.custNo = c.custno
WHERE c.custno IS NULL;

SELECT sd.transNo, sd.prodCode 
FROM salesDetail sd
LEFT JOIN sales s ON sd.transNo = s.transNo
WHERE s.transNo IS NULL;

SELECT sd.transNo, sd.prodCode 
FROM salesDetail sd
LEFT JOIN product p ON sd.prodCode = p.prodCode
WHERE p.prodCode IS NULL;

SELECT ph.prodCode, ph.effDate 
FROM priceHist ph
LEFT JOIN product p ON ph.prodCode = p.prodCode
WHERE p.prodCode IS NULL;
