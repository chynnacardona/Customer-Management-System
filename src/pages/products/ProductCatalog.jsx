import { useMemo, useState } from 'react'
import { Boxes, Coins, Package, Search } from 'lucide-react'

// para kay M1: palitan to ng getProducts() + getCurrentPrice(prodCode) kapag ready na yung service layer
const DUMMY_PRODUCTS = [
  { prodCode: 'AK0001', description: 'All-Purpose Cleaner', unit: 'ltr', currentPrice: 145.00, priceEffDate: '2026-03-01' },
  { prodCode: 'AK0004', description: 'Dishwashing Liquid', unit: 'ltr', currentPrice: 210.00, priceEffDate: '2026-03-01' },
  { prodCode: 'AK0005', description: 'Glass Cleaner', unit: 'ltr', currentPrice: 132.00, priceEffDate: '2026-02-15' },
  { prodCode: 'AK0008', description: 'Bathroom Disinfectant', unit: 'ltr', currentPrice: 245.00, priceEffDate: '2026-03-12' },
  { prodCode: 'AK0010', description: 'Laundry Powder', unit: 'pkg', currentPrice: 280.00, priceEffDate: '2026-03-20' },
  { prodCode: 'AK0011', description: 'Floor Wax', unit: 'ltr', currentPrice: 510.00, priceEffDate: '2026-02-28' },
  { prodCode: 'AK0020', description: 'Kitchen Degreaser', unit: 'ltr', currentPrice: 165.00, priceEffDate: '2026-03-18' },
  { prodCode: 'AK0022', description: 'Fabric Conditioner', unit: 'ltr', currentPrice: 195.00, priceEffDate: '2026-03-20' },
  { prodCode: 'AK0024', description: 'Paper Towels', unit: 'pkg', currentPrice: 74.00, priceEffDate: '2026-02-10' },
  { prodCode: 'AK0031', description: 'Hand Soap Refill', unit: 'ltr', currentPrice: 89.00, priceEffDate: '2026-03-05' },
]

function ProductCatalog() {
  const [search, setSearch] = useState('')

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return DUMMY_PRODUCTS

    return DUMMY_PRODUCTS.filter((product) =>
      product.prodCode.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term) ||
      product.unit.toLowerCase().includes(term)
    )
  }, [search])

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)

  return (
    <>
      <style>{`
        @keyframes productPageIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .product-page {
          animation: productPageIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .product-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .product-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .product-title-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7eb8ff;
          background: rgba(46, 134, 245, 0.12);
          border: 1px solid rgba(100, 160, 255, 0.14);
          box-shadow: 0 8px 24px rgba(30, 80, 220, 0.16);
        }

        .product-title {
          font-size: 20px;
          font-weight: 800;
          color: white;
          margin: 0;
          line-height: 1;
          letter-spacing: 0;
        }

        .product-subtitle {
          font-size: 12px;
          color: rgba(180, 210, 255, 0.35);
          margin: 6px 0 0;
        }

        .product-search {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 260px;
          background: rgba(100, 160, 255, 0.04);
          border: 1px solid rgba(100, 160, 255, 0.1);
          border-radius: 10px;
          padding: 8px 12px;
          transition: all 0.2s ease;
        }

        .product-search:focus-within {
          border-color: rgba(100, 160, 255, 0.3);
          background: rgba(100, 160, 255, 0.07);
          box-shadow: 0 0 0 3px rgba(60, 120, 255, 0.08);
        }

        .product-search svg {
          color: rgba(180, 210, 255, 0.28);
          flex-shrink: 0;
        }

        .product-search input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: rgba(220, 235, 255, 0.86);
          font-size: 12.5px;
        }

        .product-search input::placeholder {
          color: rgba(180, 210, 255, 0.24);
        }

        .product-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .product-stat {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(8, 18, 40, 0.62);
          border: 1px solid rgba(100, 160, 255, 0.1);
          border-radius: 14px;
          padding: 14px;
          color: rgba(126, 184, 255, 0.76);
        }

        .product-stat-label {
          display: block;
          font-size: 9px;
          font-weight: 700;
          color: rgba(180, 210, 255, 0.3);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .product-stat-value {
          display: block;
          color: rgba(235, 245, 255, 0.92);
          font-size: 15px;
          font-weight: 800;
        }

        .product-table-card {
          background: rgba(8, 18, 40, 0.62);
          border: 1px solid rgba(100, 160, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .product-table-scroll {
          overflow-x: auto;
        }

        .product-table {
          width: 100%;
          border-collapse: collapse;
        }

        .product-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          color: rgba(180, 210, 255, 0.35);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
          background: rgba(100, 160, 255, 0.03);
          border-bottom: 1px solid rgba(100, 160, 255, 0.08);
        }

        .product-table td {
          padding: 13px 16px;
          font-size: 12.5px;
          color: rgba(180, 210, 255, 0.68);
          white-space: nowrap;
          border-bottom: 1px solid rgba(100, 160, 255, 0.05);
        }

        .product-table tbody tr:last-child td {
          border-bottom: none;
        }

        .product-table tbody tr:hover {
          background: rgba(100, 160, 255, 0.06);
        }

        .product-code {
          font-family: monospace;
          color: rgba(180, 210, 255, 0.52) !important;
          font-weight: 700;
        }

        .product-desc {
          color: rgba(220, 235, 255, 0.9) !important;
          font-weight: 700;
        }

        .unit-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 34px;
          padding: 3px 8px;
          border-radius: 7px;
          background: rgba(100, 160, 255, 0.08);
          border: 1px solid rgba(100, 160, 255, 0.14);
          color: rgba(126, 184, 255, 0.88);
          font-size: 11px;
          font-weight: 700;
        }

        .price-cell {
          color: rgba(235, 245, 255, 0.92) !important;
          font-weight: 800;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .date-cell {
          color: rgba(180, 210, 255, 0.42) !important;
        }

        .product-empty {
          padding: 48px 16px;
          text-align: center;
          color: rgba(180, 210, 255, 0.28);
          font-size: 13px;
        }

        @media (max-width: 780px) {
          .product-search { min-width: 100%; }
          .product-stats { grid-template-columns: 1fr; }
          .product-table { min-width: 680px; }
        }
      `}</style>

      <div className="product-page">
        <div className="product-header">
          <div className="product-title-wrap">
            <div className="product-title-icon"><Package size={20} /></div>
            <div>
              <h1 className="product-title">Product Catalogue</h1>
              <p className="product-subtitle">Read-only product list with latest effective price</p>
            </div>
          </div>

          <div className="product-search">
            <Search size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product code, description, unit..."
            />
          </div>
        </div>

        <div className="product-stats">
          <div className="product-stat">
            <Boxes size={17} />
            <div><span className="product-stat-label">Products</span><span className="product-stat-value">{filteredProducts.length}</span></div>
          </div>
          <div className="product-stat">
            <Coins size={17} />
            <div><span className="product-stat-label">Highest Price</span><span className="product-stat-value">{formatCurrency(Math.max(...DUMMY_PRODUCTS.map((p) => p.currentPrice)))}</span></div>
          </div>
          <div className="product-stat">
            <Package size={17} />
            <div><span className="product-stat-label">View Mode</span><span className="product-stat-value">Read Only</span></div>
          </div>
        </div>

        <section className="product-table-card">
          {filteredProducts.length === 0 ? (
            <div className="product-empty">No products found</div>
          ) : (
            <div className="product-table-scroll">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Prod Code</th>
                    <th>Description</th>
                    <th>Unit</th>
                    <th style={{ textAlign: 'right' }}>Current Price</th>
                    <th>Effective Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.prodCode}>
                      <td className="product-code">{product.prodCode}</td>
                      <td className="product-desc">{product.description}</td>
                      <td><span className="unit-badge">{product.unit}</span></td>
                      <td className="price-cell">{formatCurrency(product.currentPrice)}</td>
                      <td className="date-cell">{product.priceEffDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  )
}

export default ProductCatalog