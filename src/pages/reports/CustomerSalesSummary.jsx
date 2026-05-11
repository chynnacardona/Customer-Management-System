import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Loader2, Search, ShoppingCart, Users, Wallet } from 'lucide-react'
import FilterDropdown from '../../components/shared/FilterDropdown'
import {
  getCustomerSalesSummary,
  getReportValue,
} from '../../services/reportsApi'
import { useCurrencyFormatter } from '../../utils/currency'
import './Reports.css'

function CustomerSalesSummary() {
  const { formatCurrency } = useCurrencyFormatter()
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [salesFilter, setSalesFilter] = useState('ALL')
  const [sortFilter, setSortFilter] = useState('SPEND_DESC')
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

    const filtered = rows.filter((row) => {
      const transactions = Number(getReportValue(row, 'totalTransactions', 'totaltransactions') || 0)
      const matchesSearch =
        !term ||
        [
          row.custno,
          row.custname,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term))
      const matchesSales =
        salesFilter === 'ALL' ||
        (salesFilter === 'WITH_SALES' && transactions > 0) ||
        (salesFilter === 'NO_SALES' && transactions === 0)

      return matchesSearch && matchesSales
    })

    return [...filtered].sort((a, b) => {
      if (sortFilter === 'TX_DESC') {
        return Number(getReportValue(b, 'totalTransactions', 'totaltransactions') || 0) - Number(getReportValue(a, 'totalTransactions', 'totaltransactions') || 0)
      }
      if (sortFilter === 'NAME_ASC') {
        return String(a.custname || '').localeCompare(String(b.custname || ''))
      }
      return Number(getReportValue(b, 'totalSpend', 'totalspend') || 0) - Number(getReportValue(a, 'totalSpend', 'totalspend') || 0)
    })
  }, [rows, salesFilter, search, sortFilter])

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
            <p className="reports-subtitle">Searchable summary of customers, transactions, and total spend.</p>
          </div>
        </div>

        <div className="reports-filters">
          <div className="reports-search">
            <Search size={14} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer..."
            />
          </div>
          <FilterDropdown
            label="Customer sales"
            value={salesFilter}
            onChange={setSalesFilter}
            options={[
              { value: 'ALL', label: 'All Customers' },
              { value: 'WITH_SALES', label: 'With Sales' },
              { value: 'NO_SALES', label: 'No Sales' },
            ]}
          />
          <FilterDropdown
            label="Sort"
            value={sortFilter}
            onChange={setSortFilter}
            options={[
              { value: 'SPEND_DESC', label: 'Spend High-Low' },
              { value: 'TX_DESC', label: 'Transactions High-Low' },
              { value: 'NAME_ASC', label: 'Name A-Z' },
            ]}
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
                  <th>Transactions</th>
                  <th className="reports-align-center">Total Spend</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const totalTransactions = getReportValue(row, 'totalTransactions', 'totaltransactions') || 0
                  const totalSpend = getReportValue(row, 'totalSpend', 'totalspend') || 0

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
                      <td>{Number(totalTransactions).toLocaleString()}</td>
                      <td className="reports-money-cell reports-align-center">{formatCurrency(totalSpend)}</td>
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
