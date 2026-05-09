import { useEffect, useMemo, useState } from 'react'
import { Loader2, Package, Search, ShoppingCart, Wallet } from 'lucide-react'
import {
  formatCurrency,
  getProductRevenue,
  getReportValue,
} from '../../services/reportsApi'
import './Reports.css'

function ProductRevenue() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProductRevenue = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await getProductRevenue()
        setRows(data)
      } catch (err) {
        setError(err.message || 'Unable to load product revenue.')
      } finally {
        setLoading(false)
      }
    }

    loadProductRevenue()
  }, [])

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows

    return rows.filter((row) =>
      [row.prodCode, row.prodcode, row.description, row.unit]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    )
  }, [rows, search])

  const stats = useMemo(() => {
    const totalQty = rows.reduce(
      (sum, row) => sum + Number(getReportValue(row, 'totalQtySold', 'totalqtysold') || 0),
      0
    )
    const totalRevenue = rows.reduce(
      (sum, row) => sum + Number(getReportValue(row, 'totalRevenue', 'totalrevenue') || 0),
      0
    )

    return { productCount: rows.length, totalQty, totalRevenue }
  }, [rows])

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div className="reports-title-wrap">
          <div className="reports-title-icon"><Package size={20} /></div>
          <div>
            <h1 className="reports-title">Product Revenue</h1>
            <p className="reports-subtitle">Read-only revenue report by product description, quantity sold, and revenue.</p>
          </div>
        </div>

        <div className="reports-search">
          <Search size={14} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product, code, unit..."
          />
        </div>
      </div>

      <section className="reports-stat-grid" aria-label="Product revenue totals">
        <div className="reports-stat-card">
          <div className="reports-stat-icon"><Package size={17} /></div>
          <div>
            <span className="reports-stat-label">Products</span>
            <span className="reports-stat-value">{stats.productCount}</span>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon"><ShoppingCart size={17} /></div>
          <div>
            <span className="reports-stat-label">Qty Sold</span>
            <span className="reports-stat-value">{stats.totalQty.toLocaleString()}</span>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon"><Wallet size={17} /></div>
          <div>
            <span className="reports-stat-label">Revenue</span>
            <span className="reports-stat-value">{formatCurrency(stats.totalRevenue)}</span>
          </div>
        </div>
      </section>

      {error && <div className="reports-feedback">{error}</div>}

      <section className="reports-table-card">
        {loading ? (
          <div className="reports-empty">
            <Loader2 className="animate-spin mb-3 mx-auto text-blue-400" size={28} />
            <p>Loading product revenue...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="reports-empty">No product revenue records found.</div>
        ) : (
          <div className="reports-table-scroll">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Description</th>
                  <th>Unit</th>
                  <th>Total Qty Sold</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const prodCode = getReportValue(row, 'prodCode', 'prodcode')
                  const totalQtySold = getReportValue(row, 'totalQtySold', 'totalqtysold') || 0
                  const totalRevenue = getReportValue(row, 'totalRevenue', 'totalrevenue') || 0

                  return (
                    <tr key={prodCode}>
                      <td className="reports-code-cell">{prodCode}</td>
                      <td className="reports-primary-cell">{row.description || '-'}</td>
                      <td>{row.unit || '-'}</td>
                      <td>{Number(totalQtySold).toLocaleString()}</td>
                      <td className="reports-money-cell">{formatCurrency(totalRevenue)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default ProductRevenue
