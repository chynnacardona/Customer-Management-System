import { useEffect, useMemo, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
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
    <div className="product-page">
      <div className="product-header">
        <h1 className="product-title">Product Catalogue</h1>
        <div className="product-search">
          <Search size={14} />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search products..." 
          />
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
                  // We fetch pricehist ordered by effdate desc in the API,
                  // so index 0 is always the most recent price.
                  const latestPriceEntry = product.pricehist?.[0];
                  const currentPrice = latestPriceEntry?.unitprice || 0;

                  return (
                    <tr key={product.prodcode}>
                      <td>{product.prodcode}</td>
                      <td>{product.description}</td>
                      <td>{product.unit}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {formatCurrency(currentPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default ProductCatalog;