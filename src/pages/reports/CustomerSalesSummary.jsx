import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, ChevronDown, ChevronUp, Search, ShoppingCart, Users, UserX, Wallet } from 'lucide-react'
import { formatCurrency, getCustomerSalesSummary } from '../../services/reportsApi'
import FilterDropdown from '../../components/shared/FilterDropdown'
import './Reports.css'

// IMPORTANT: user_type should be passed from your auth context/state
function CustomerSalesSummary({ user_type = 'USER' }) { 
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [paytermFilter, setPaytermFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortConfig, setSortConfig] = useState({ key: 'totalSpend', direction: 'desc' })

  const isAdmin = user_type === 'ADMIN' || user_type === 'SUPERADMIN'

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await getCustomerSalesSummary()
        setRows(data || [])
      } catch {
        setRows([])
      }
    }
    loadSummary()
  }, [])

  const { filteredRows, stats } = useMemo(() => {
    // 1. Role Filter: Standard USERS only see ACTIVE customers
    const roleBasedData = isAdmin 
      ? rows 
      : rows.filter(r => String(r.record_status || '').toUpperCase() === 'ACTIVE')

    const filtered = roleBasedData.filter((row) => {
      const status = String(row.record_status || '').toUpperCase()
      const matchesPayterm = paytermFilter === 'ALL' || row.payterm === paytermFilter
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter
      return matchesPayterm && matchesStatus
    })

    const term = search.trim().toLowerCase()
    const searched = term 
      ? filtered.filter(r => 
          [r.custname, r.custno, r.payterm, r.record_status, r.totalTransactions, r.totalSpend, formatCurrency(r.totalSpend)].some(v => String(v || '').toLowerCase().includes(term))
        )
      : filtered

    const direction = sortConfig.direction === 'asc' ? 1 : -1
    const sorted = [...searched].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (typeof aValue === 'number' || typeof bValue === 'number') {
        return (Number(aValue || 0) - Number(bValue || 0)) * direction
      }

      return String(aValue || '').localeCompare(String(bValue || '')) * direction
    })

    // 2. Card Logic: Calculate ACTIVE and INACTIVE counts for cards
    const activeCount = rows.filter(r => String(r.record_status || '').toUpperCase() === 'ACTIVE').length
    const inactiveCount = rows.filter(r => String(r.record_status || '').toUpperCase() !== 'ACTIVE').length
    
    const totalTransactions = searched.reduce((sum, r) => sum + (r.totalTransactions || 0), 0)
    const totalSpend = searched.reduce((sum, r) => sum + (r.totalSpend || 0), 0)

    return { 
      filteredRows: sorted, 
      stats: { activeCount, inactiveCount, totalTransactions, totalSpend } 
    }
  }, [rows, search, isAdmin, paytermFilter, statusFilter, sortConfig])

  const paytermOptions = useMemo(() => {
    return [...new Set(rows.map((row) => row.payterm).filter(Boolean))].sort()
  }, [rows])

  const statusOptions = useMemo(() => {
    return [...new Set(rows.map((row) => String(row.record_status || '').toUpperCase()).filter(Boolean))].sort()
  }, [rows])

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const sortLabel = (key, label) => {
    const active = sortConfig.key === key
    const SortIcon = sortConfig.direction === 'asc' ? ChevronUp : ChevronDown
    return (
      <>
        <span>{label}</span>
        {active && <SortIcon className="sort-side-icon" size={13} />}
      </>
    )
  }

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
        <div className="reports-filters">
          <div className="reports-search">
            <Search size={14} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer, pay, status, amount..." />
          </div>
          <FilterDropdown
            label="Pay Term"
            value={paytermFilter}
            onChange={setPaytermFilter}
            options={[
              { value: 'ALL', label: 'All Pay Terms' },
              ...paytermOptions.map((payterm) => ({ value: payterm, label: payterm })),
            ]}
          />
          {isAdmin && (
            <FilterDropdown
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: 'All Status' },
                ...statusOptions.map((status) => ({ value: status, label: status })),
              ]}
            />
          )}
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
                <th><button type="button" className="reports-sort-btn" onClick={() => handleSort('custname')}>{sortLabel('custname', 'Customer')}</button></th>
                <th><button type="button" className="reports-sort-btn" onClick={() => handleSort('payterm')}>{sortLabel('payterm', 'Pay Term')}</button></th>
                <th><button type="button" className="reports-sort-btn" onClick={() => handleSort('totalTransactions')}>{sortLabel('totalTransactions', 'Transactions')}</button></th>
                <th><button type="button" className="reports-sort-btn" onClick={() => handleSort('totalSpend')}>{sortLabel('totalSpend', 'Total Spend')}</button></th>
                {isAdmin && <th><button type="button" className="reports-sort-btn" onClick={() => handleSort('record_status')}>{sortLabel('record_status', 'Status')}</button></th>}
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
                  <td>{row.totalTransactions.toLocaleString()}</td>
                  <td className="reports-money-cell">
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
