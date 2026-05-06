import { useEffect, useMemo, useState } from 'react'
import { Boxes, Coins, Package, Search, Loader2 } from 'lucide-react'
import { getProducts, getCurrentPrice } from '../../services/salesProductApi'

function ProductCatalog() {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLiveCatalog = async () => {
      try {
        setLoading(true)
        const productList = await getProducts()
        
        const productsWithPrices = await Promise.all(
          productList.map(async (p) => {
            const price = await getCurrentPrice(p.product_code)
            return {
              prodCode: p.product_code,
              description: p.description,
              unit: p.unit,
              currentPrice: price,
              priceEffDate: p.updated_at || 'N/A'
            }
          })
        )
        
        setProducts(productsWithPrices)
      } catch (err) {
        console.error("Failed to load catalog:", err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchLiveCatalog()
  }, [])

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return products
    return products.filter((p) =>
      p.prodCode.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term)
    )
  }, [search, products])

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)

  return (
    <div className="product-page">
       {/* Use the styles you already have in your file */}
       <div className="product-header">
          <h1 className="product-title">Product Catalogue</h1>
          <div className="product-search">
            <Search size={14} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." />
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
                {/* Change your map to look like this */}
                <tbody>
                  {products.map((product, index) => {
                    // 1. Force everything to lowercase variables to match Supabase
                    const pCode = product.prodcode || product.prodCode;
                    const priceData = product.pricehist?.[0]; 
                    const pPrice = priceData?.unitprice || 0;

                    return (
                      <tr key={pCode || `prod-${index}`}> 
                        {/* Fixes 'Unique Key' by ensuring pCode isn't undefined */}
                        <td className="custno-cell">{pCode}</td>
                        <td className="custname-cell">{product.description}</td>
                        <td>{product.unit}</td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#60a5fa' }}>
                          {/* Fixes ₱NaN and those 406 network errors */}
                          {formatCurrency(pPrice)}
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