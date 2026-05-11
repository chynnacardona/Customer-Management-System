import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Medal, ShoppingCart, Trophy, Users, Wallet } from 'lucide-react'
import {
  formatCurrency,
  getReportValue,
  getTopCustomers,
} from '../../services/reportsApi'
import './Reports.css'

function TopCustomers() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadTopCustomers = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await getTopCustomers(10)
        setRows(data)
      } catch (err) {
        setError(err.message || 'Unable to load top customers.')
      } finally {
        setLoading(false)
      }
    }

    loadTopCustomers()
  }, [])

  const stats = useMemo(() => {
    const totalSpend = rows.reduce(
      (sum, row) => sum + Number(getReportValue(row, 'total_spent', 'total_spent') || 0),
      0
    )
    const totalTransactions = rows.reduce(
      (sum, row) => sum + Number(getReportValue(row, 'total_transactions', 'total_transactions') || 0),
      0
    )
    const topSpend = Math.max(
      ...rows.map((row) => Number(getReportValue(row, 'total_spent', 'total_spent') || 0)),
      0
    )

    return { totalSpend, totalTransactions, topSpend }
  }, [rows])

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div className="reports-title-wrap">
          <div className="reports-title-icon"><Trophy size={20} color="#ffffff" /></div>
          <div>
            <h1 className="reports-title" style={{ color: '#ffffff' }}>Top Customers</h1>
            <p className="reports-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Ranked top 10 customers by total spend, linked to customer detail.
            </p>
          </div>
        </div>
      </div>

      <section className="reports-stat-grid" aria-label="Top customer totals">
        <div className="reports-stat-card">
          <div className="reports-stat-icon"><Users size={17} color="#ffffff" /></div>
          <div>
            <span className="reports-stat-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Ranked Customers</span>
            <span className="reports-stat-value">{rows.length}</span>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon"><ShoppingCart size={17} color="#ffffff" /></div>
          <div>
            <span className="reports-stat-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Transactions</span>
            <span className="reports-stat-value">{stats.totalTransactions}</span>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon"><Wallet size={17} color="#ffffff" /></div>
          <div>
            <span className="reports-stat-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Top 10 Spend</span>
            <span className="reports-stat-value">{formatCurrency(stats.totalSpend)}</span>
          </div>
        </div>
      </section>

      {error && <div className="reports-feedback" style={{ color: '#ff6b6b' }}>{error}</div>}

      <section className="leaderboard-card">
        {loading ? (
          <div className="reports-empty">
            <Loader2 className="animate-spin mb-3 mx-auto text-blue-400" size={28} />
            <p style={{ color: '#ffffff' }}>Loading top customers...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="reports-empty" style={{ color: '#ffffff' }}>No ranked customers found.</div>
        ) : (
          <div className="leaderboard-list">
            {rows.map((row, index) => {
              const totalSpend = Number(getReportValue(row, 'total_spent', 'total_spent') || 0)
              const totalTransactions = Number(getReportValue(row, 'total_transactions', 'total_transactions') || 0)
              const width = stats.topSpend > 0 ? Math.max((totalSpend / stats.topSpend) * 100, 3) : 0

              return (
                <div className="leaderboard-row" key={row.custno || row.custname}>
                  <div className="leaderboard-rank" style={{ color: '#ffffff' }}>
                    {index < 3 ? <Medal size={15} color="#ffffff" /> : index + 1}
                  </div>
                  <div className="leaderboard-name" style={{ color: '#ffffff' }}>
                    {row.custno ? (
                      <Link to={`/customers/${row.custno}`} style={{ color: '#ffffff', fontWeight: 'bold' }}>
                        {row.custname || row.custno}
                      </Link>
                    ) : (
                      <strong style={{ color: '#ffffff' }}>{row.custname || 'Unknown customer'}</strong>
                    )}
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {row.custno ? `${row.custno} - ` : ''}{totalTransactions.toLocaleString()} transactions
                    </span>
                  </div>
                  <div className="leaderboard-meter-wrap">
                    <div className="leaderboard-meter" aria-hidden="true" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div className="leaderboard-meter-fill" style={{ width: `${width}%`, background: '#3b82f6' }} />
                    </div>
                    <div className="leaderboard-value">{formatCurrency(totalSpend)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default TopCustomers