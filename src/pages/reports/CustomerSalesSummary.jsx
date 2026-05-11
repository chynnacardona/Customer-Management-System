import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Loader2, Search, ShoppingCart, Users, Wallet } from 'lucide-react'
import {
  formatCurrency,
  getCustomerSalesSummary,
  getReportValue,
} from '../../services/reportsApi'
import './Reports.css'

function CustomerSalesSummary() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await getCustomerSalesSummary()
        setRows(data || [])
      } catch (err) {
        console.error('Report Load Error:', err)
        setError(err.message || 'Unable to load customer sales summary.')
      } finally {
        setLoading(false)
      }
    }
    loadSummary()
  }, [])

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows

    return rows.filter((row) =>
      [
        row.custno,
        row.custname,
        getReportValue(row, 'recordStatus', 'record_status'),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    )
  }, [rows, search])

  const stats = useMemo(() => {
    const totalSpend = rows.reduce(
      (sum, row) => sum + Number(getReportValue(row, 'totalSpend', 'total_spent') || 0),
      0
    )
    const totalTransactions = rows.reduce(
      (sum, row) => sum + Number(getReportValue(row, 'totalTransactions', 'total_transactions') || 0),
      0
    )
    return { totalCustomers: rows.length, totalSpend, totalTransactions }
  }, [rows])

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div className="reports-title-wrap">
          <div className="reports-title-icon"><BarChart3 size={20} color="#ffffff" /></div>
          <div>
            <h1 className="reports-title" style={{ color: '#ffffff' }}>Customer Sales Summary</h1>
            <p className="reports-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Summary of total transactions and total spend per customer.
            </p>
          </div>
        </div>

        <div className="reports-search">
          <Search size={14} color="#ffffff" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer name or ID..."
            style={{ color: '#ffffff', background: 'transparent', border: 'none', outline: 'none' }}
          />
        </div>
      </div>

      <section className="reports-stat-grid" aria-label="Customer sales summary totals">
        <div className="reports-stat-card">
          <div className="reports-stat-icon"><Users size={17} color="#ffffff" /></div>
          <div>
            <span className="reports-stat-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Customers</span>
            <span className="reports-stat-value" style={{ color: '#ffffff' }}>{stats.totalCustomers}</span>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon"><ShoppingCart size={17} color="#ffffff" /></div>
          <div>
            <span className="reports-stat-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Transactions</span>
            <span className="reports-stat-value" style={{ color: '#ffffff' }}>{stats.totalTransactions}</span>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon"><Wallet size={17} color="#ffffff" /></div>
          <div>
            <span className="reports-stat-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Total Spend</span>
            <span className="reports-stat-value">{formatCurrency(stats.totalSpend)}</span>
          </div>
        </div>
      </section>

      {error && <div className="reports-feedback" style={{ color: '#ff6b6b' }}>{error}</div>}

      <section className="reports-table-card">
        {loading ? (
          <div className="reports-empty">
            <Loader2 className="animate-spin mb-3 mx-auto text-blue-400" size={28} />
            <p style={{ color: '#ffffff' }}>Loading summary...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="reports-empty" style={{ color: '#ffffff' }}>No records found.</div>
        ) : (
          <div className="reports-table-scroll">
            <table className="reports-table">
              <thead>
                <tr style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <th align="left">Customer</th>
                  <th align="left">Transactions</th>
                  <th align="left">Total Spend</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const tTransactions = getReportValue(row, 'totalTransactions', 'total_transactions') || 0
                  const tSpend = getReportValue(row, 'totalSpend', 'total_spent') || 0

                  return (
                    <tr key={row.custno || row.custname} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 0' }}>
                        <Link to={`/customers/${row.custno}`} style={{ color: '#ffffff', fontWeight: 'bold', textDecoration: 'none' }}>
                          {row.custname || row.custno}
                        </Link>
                        {row.custno && (
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                            {row.custno}
                          </div>
                        )}
                      </td>
                      <td style={{ color: '#ffffff' }}>
                        {Number(tTransactions).toLocaleString()}
                      </td>
                      <td className="reports-money-cell" style={{ fontWeight: 'bold' }}>
                        {formatCurrency(tSpend)}
                      </td>
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

export default CustomerSalesSummary