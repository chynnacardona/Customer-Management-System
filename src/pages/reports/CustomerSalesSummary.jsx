import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Loader2, Search, ShoppingCart, Users, UserX, Wallet } from 'lucide-react'
import { formatCurrency, getCustomerSalesSummary } from '../../services/reportsApi'
import './Reports.css'

// IMPORTANT: user_type should be passed from your auth context/state
function CustomerSalesSummary({ user_type = 'USER' }) { 
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const isAdmin = user_type === 'ADMIN' || user_type === 'SUPERADMIN'

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true)
        const data = await getCustomerSalesSummary()
        setRows(data || [])
      } catch (err) {
        console.error('Report Error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSummary()
  }, [])

  const { filteredRows, stats } = useMemo(() => {
    // 1. Role Filter: Standard USERS only see ACTIVE customers
    const roleBasedData = isAdmin 
      ? rows 
      : rows.filter(r => String(r.record_status || '').toUpperCase() === 'ACTIVE')

    const term = search.trim().toLowerCase()
    const searched = term 
      ? roleBasedData.filter(r => 
          [r.custname, r.custno, r.payterm].some(v => String(v || '').toLowerCase().includes(term))
        )
      : roleBasedData

    // 2. Card Logic: Calculate ACTIVE and INACTIVE counts for cards
    const activeCount = rows.filter(r => String(r.record_status || '').toUpperCase() === 'ACTIVE').length
    const inactiveCount = rows.filter(r => String(r.record_status || '').toUpperCase() !== 'ACTIVE').length
    
    const totalTransactions = searched.reduce((sum, r) => sum + (r.totalTransactions || 0), 0)
    const totalSpend = searched.reduce((sum, r) => sum + (r.totalSpend || 0), 0)

    return { 
      filteredRows: searched, 
      stats: { activeCount, inactiveCount, totalTransactions, totalSpend } 
    }
  }, [rows, search, isAdmin])

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div className="reports-title-wrap">
          <div className="reports-title-icon"><BarChart3 size={20} /></div>
          <div>
            <h1 className="reports-title">Customer Sales Summary</h1>
            <p className="reports-subtitle">Transaction history and account status.</p>
          </div>
        </div>
        <div className="reports-search">
          <Search size={14} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
        </div>
      </div>

      <section className="reports-stat-grid">
        {/* Requirement: Split cards for Admin/Superadmin */}
        <div className="reports-stat-card">
          <div className="reports-stat-icon"><Users size={17} /></div>
          <div>
            <span className="reports-stat-label">{isAdmin ? 'Active' : 'Customers'}</span>
            <span className="reports-stat-value">{stats.activeCount}</span>
          </div>
        </div>

        {isAdmin && (
          <div className="reports-stat-card">
            <div className="reports-stat-icon" style={{ color: '#ef4444' }}><UserX size={17} /></div>
            <div>
              <span className="reports-stat-label">Inactive</span>
              <span className="reports-stat-value">{stats.inactiveCount}</span>
            </div>
          </div>
        )}

        <div className="reports-stat-card">
          <div className="reports-stat-icon"><ShoppingCart size={17} /></div>
          <div>
            <span className="reports-stat-label">Transactions</span>
            <span className="reports-stat-value">{stats.totalTransactions.toLocaleString()}</span>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon"><Wallet size={17} /></div>
          <div>
            <span className="reports-stat-label">Total Spend</span>
            <span className="reports-stat-value">{formatCurrency(stats.totalSpend)}</span>
          </div>
        </div>
      </section>

      <section className="reports-table-card">
        <div className="reports-table-scroll">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Pay Term</th>
                <th style={{ textAlign: 'right' }}>Transactions</th>
                <th style={{ textAlign: 'right' }}>Total Spend</th>
                {isAdmin && <th>Status</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.custno}>
                  <td>
                    <Link className="reports-link" to={`/customers/${row.custno}`}>{row.custname}</Link>
                    <div className="reports-code-cell">{row.custno}</div>
                  </td>
                  <td><span className="payterm-badge">{row.payterm || '-'}</span></td>
                  <td style={{ textAlign: 'right' }}>{row.totalTransactions.toLocaleString()}</td>
                  <td className="reports-money-cell" style={{ textAlign: 'right' }}>
                    {formatCurrency(row.totalSpend)}
                  </td>
                  {isAdmin && (
                    <td>
                      <span className={`status-pill ${String(row.record_status || 'inactive').toLowerCase()}`}>
                        {row.record_status || 'INACTIVE'}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default CustomerSalesSummary
