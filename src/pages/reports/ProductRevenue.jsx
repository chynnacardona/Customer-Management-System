import { useEffect, useMemo, useState } from 'react'
import { Loader2, Package, Search, ShoppingCart, Wallet } from 'lucide-react'
import FilterDropdown from '../../components/shared/FilterDropdown'
import {
  getProductRevenue,
  getReportValue,
} from '../../services/reportsApi'
import { useCurrencyFormatter } from '../../utils/currency'
import './Reports.css'

function ProductRevenue() {
  const { formatCurrency } = useCurrencyFormatter()
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [unitFilter, setUnitFilter] = useState('ALL')
  const [revenueFilter, setRevenueFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProductRevenue = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await getProductRevenue()
        setRows(data || [])
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

    return rows.filter((row) => {
      const revenue = Number(getReportValue(row, 'totalRevenue', 'totalrevenue') || 0)
      const matchesSearch =
        !term ||
        [row.prodCode, row.prodcode, row.description, row.unit]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term))
      const matchesUnit = unitFilter === 'ALL' || row.unit === unitFilter
      const matchesRevenue =
        revenueFilter === 'ALL' ||
        (revenueFilter === 'WITH_REVENUE' && revenue > 0) ||
        (revenueFilter === 'NO_REVENUE' && revenue === 0)

      return matchesSearch && matchesUnit && matchesRevenue
    })
  }, [revenueFilter, rows, search, unitFilter])

  const unitOptions = useMemo(() => {
    return [...new Set(rows.map((row) => row.unit).filter(Boolean))].sort()
  }, [rows])

  const stats = useMemo(() => {
    // UPDATED: Now uses 'total_units_sold' and 'total_revenue'
    const totalQty = rows.reduce(
      (sum, row) => sum + Number(getReportValue(row, 'totalQtySold', 'total_units_sold') || 0),
      0
    )
    const totalRevenue = rows.reduce(
      (sum, row) => sum + Number(getReportValue(row, 'totalRevenue', 'total_revenue') || 0),
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

        <div className="reports-filters">
          <div className="reports-search">
            <Search size={14} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product, code, unit..."
            />
          </div>
          <FilterDropdown
            label="Unit"
            value={unitFilter}
            onChange={setUnitFilter}
            options={[
              { value: 'ALL', label: 'All Units' },
              ...unitOptions.map((unit) => ({ value: unit, label: unit })),
            ]}
          />
          <FilterDropdown
            label="Revenue"
            value={revenueFilter}
            onChange={setRevenueFilter}
            options={[
              { value: 'ALL', label: 'All Revenue' },
              { value: 'WITH_REVENUE', label: 'With Revenue' },
              { value: 'NO_REVENUE', label: 'No Revenue' },
            ]}
          />
        </div>
      </div>

      <section className="reports-stat-grid">
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
                  <th className="reports-align-center">Unit</th>
                  <th className="reports-align-center">Total Qty Sold</th>
                  <th className="reports-align-center">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  // UPDATED: Key mapping to match your SQL underscores
                  const pCode = getReportValue(row, 'prodcode', 'prodCode')
                  const qty = getReportValue(row, 'total_units_sold', 'totalQtySold') || 0
                  const rev = getReportValue(row, 'total_revenue', 'totalRevenue') || 0

                  return (
                    <tr key={pCode}>
                      <td className="reports-code-cell">{pCode}</td>
                      <td className="reports-primary-cell">{row.description || '-'}</td>
                      <td className="reports-align-center">{row.unit || '-'}</td>
                      <td className="reports-align-center">{Number(qty).toLocaleString()}</td>
                      <td className="reports-money-cell reports-align-center">{formatCurrency(rev)}</td>
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