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
        setRows(data)
      } catch (err) {
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
        row.payterm,
        getReportValue(row, 'record_status', 'recordStatus'),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    )
  }, [rows, search])

  const stats = useMemo(() => {
    const totalSpend = rows.reduce(
      (sum, row) => sum + Number(getReportValue(row, 'totalSpend', 'totalspend') || 0),
      0
    )
    const totalTransactions = rows.reduce(
      (sum, row) => sum + Number(getReportValue(row, 'totalTransactions', 'totaltransactions') || 0),
      0
    )

    return { totalCustomers: rows.length, totalSpend, totalTransactions }
  }, [rows])

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div className="reports-title-wrap">
          <div className="reports-title-icon"><BarChart3 size={20} /></div>
          <div>
            <h1 className="reports-title">Customer Sales Summary</h1>
            <p className="reports-subtitle">Searchable summary of transactions, total spend, and last sale date.</p>
          </div>
        </div>

        <div className="reports-search">
          <Search size={14} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer, payterm, status..."
          />
        </div>
      </div>

      <section className="reports-stat-grid" aria-label="Customer sales summary totals">
        <div className="reports-stat-card">
          <div className="reports-stat-icon"><Users size={17} /></div>
          <div>
            <span className="reports-stat-label">Customers</span>
            <span className="reports-stat-value">{stats.totalCustomers}</span>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon"><ShoppingCart size={17} /></div>
          <div>
            <span className="reports-stat-label">Transactions</span>
            <span className="reports-stat-value">{stats.totalTransactions}</span>
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

      {error && <div className="reports-feedback">{error}</div>}

      <section className="reports-table-card">
        {loading ? (
          <div className="reports-empty">
            <Loader2 className="animate-spin mb-3 mx-auto text-blue-400" size={28} />
            <p>Loading customer sales summary...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="reports-empty">No customer sales summary records found.</div>
        ) : (
          <div className="reports-table-scroll">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Pay Term</th>
                  <th>Transactions</th>
                  <th>Total Spend</th>
                  <th>Last Sale</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const totalTransactions = getReportValue(row, 'totalTransactions', 'totaltransactions') || 0
                  const totalSpend = getReportValue(row, 'totalSpend', 'totalspend') || 0
                  const lastSaleDate = getReportValue(row, 'lastSaleDate', 'lastsaledate')

                  return (
                    <tr key={row.custno || row.custname}>
                      <td>
                        {row.custno ? (
                          <Link className="reports-link" to={`/customers/${row.custno}`}>
                            {row.custname || row.custno}
                          </Link>
                        ) : (
                          <span className="reports-primary-cell">{row.custname || 'Unknown customer'}</span>
                        )}
                        {row.custno && <div className="reports-code-cell">{row.custno}</div>}
                      </td>
                      <td>{row.payterm || '-'}</td>
                      <td>{Number(totalTransactions).toLocaleString()}</td>
                      <td className="reports-money-cell">{formatCurrency(totalSpend)}</td>
                      <td className="reports-date-cell">{lastSaleDate || '-'}</td>
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
