import { useEffect, useMemo, useState } from 'react'
import { Search, Loader2, Package, Boxes, Coins } from 'lucide-react'
import { getProducts } from '../../services/salesProductApi'

function ProductCatalog() {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLiveCatalog = async () => {
      try {
        setLoading(true)
        // One single fetch gets products AND their price history
        const productList = await getProducts()
        setProducts(productList)
      } catch (err) {
        console.error("Failed to load catalog:", err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchLiveCatalog()
  }, [])

  // Memoized search logic for performance
  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return products
    return products.filter((p) =>
      p.prodcode.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term)
    )
  }, [search, products])

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency: 'PHP' 
    }).format(value)

  return (
    <>
      <style>{`
        @keyframes productPageIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .product-page {
          animation: productPageIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          height: 100%;
          min-height: 0;
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
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          background: rgba(8, 18, 40, 0.62);
          border: 1px solid rgba(100, 160, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .product-table-scroll {
          flex: 1;
          min-height: 0;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(126, 184, 255, 0.45) rgba(8, 18, 40, 0.28);
        }

        .product-table-scroll::-webkit-scrollbar {
          width: 11px;
          height: 11px;
        }

        .product-table-scroll::-webkit-scrollbar-track {
          background: rgba(5, 16, 48, 0.6);
        }

        .product-table-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(46, 134, 245, 0.82), rgba(26, 79, 214, 0.88));
          border-radius: 999px;
          border: 2px solid rgba(5, 16, 48, 0.78);
        }

        .product-table-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(96, 165, 250, 0.92), rgba(46, 134, 245, 0.92));
        }

        .product-table-scroll::-webkit-scrollbar-corner {
          background: rgba(5, 16, 48, 0.6);
        }

        .product-table {
          width: 100%;
          min-width: 720px;
          height: 100%;
          border-collapse: collapse;
          display: flex;
          flex-direction: column;
        }

        .product-table thead {
          flex: 0 0 auto;
          display: table;
          width: 100%;
          table-layout: fixed;
        }

        .product-table tbody {
          flex: 1;
          min-height: 0;
          display: block;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(126, 184, 255, 0.45) rgba(8, 18, 40, 0.28);
        }

        .product-table tbody::-webkit-scrollbar {
          width: 11px;
        }

        .product-table tbody::-webkit-scrollbar-track {
          background: rgba(5, 16, 48, 0.6);
        }

        .product-table tbody::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(46, 134, 245, 0.82), rgba(26, 79, 214, 0.88));
          border-radius: 999px;
          border: 2px solid rgba(5, 16, 48, 0.78);
        }

        .product-table tbody::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(96, 165, 250, 0.92), rgba(46, 134, 245, 0.92));
        }

        .product-table tbody tr {
          display: table;
          width: 100%;
          table-layout: fixed;
        }

        .product-table th {
          position: relative;
          z-index: 1;
          padding: 12px 16px;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          color: rgba(180, 210, 255, 0.35);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
          background: rgba(10, 24, 52, 0.96);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(100, 160, 255, 0.08);
          box-shadow: 0 1px 0 rgba(100, 160, 255, 0.1), 0 10px 18px rgba(2, 8, 24, 0.18);
        }

        .product-table td {
          padding: 13px 16px;
          font-size: 12.5px;
          color: rgba(180, 210, 255, 0.68);
          white-space: nowrap;
          border-bottom: 1px solid rgba(100, 160, 255, 0.05);
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

        .product-empty {
          padding: 48px 16px;
          text-align: center;
          color: rgba(180, 210, 255, 0.28);
          font-size: 13px;
        }

        @media (max-width: 780px) {
          .product-search { min-width: 100%; }
          .product-stats { grid-template-columns: 1fr; }
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
              placeholder="Search products..." 
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
            <div><span className="product-stat-label">Highest Price</span><span className="product-stat-value">{formatCurrency(Math.max(0, ...filteredProducts.map((product) => product.pricehist?.[0]?.unitprice || 0)))}</span></div>
          </div>
          <div className="product-stat">
            <Package size={17} />
            <div><span className="product-stat-label">View Mode</span><span className="product-stat-value">Read Only</span></div>
          </div>
        </div>

        <section className="product-table-card">
          {loading ? (
            <div className="product-empty">
              <Loader2 className="animate-spin mb-3 mx-auto text-blue-400" size={32} />
              <p>Fetching latest inventory records...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
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
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const latestPriceEntry = product.pricehist?.[0]
                    const currentPrice = latestPriceEntry?.unitprice || 0

                    return (
                      <tr key={product.prodcode}>
                        <td className="product-code">{product.prodcode}</td>
                        <td className="product-desc">{product.description}</td>
                        <td><span className="unit-badge">{product.unit}</span></td>
                        <td className="price-cell">{formatCurrency(currentPrice)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  )
}

export default ProductCatalog;
