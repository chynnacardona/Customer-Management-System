import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  Download,
  LineChart as LineChartIcon,
  Loader2,
  X,
  ShoppingBag,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  Label,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import FilterDropdown from '../../components/shared/FilterDropdown'
import { useAuth } from '../../context/useAuth'
import { customerService } from '../../services/customerService'
import { getAuditLogs } from '../../services/auditLogService'
import { getSales } from '../../services/salesProductApi'
import { useCurrencyFormatter } from '../../utils/currency'
import { buildActorSnapshot } from '../../utils/stampAudit'
import { supabase } from '../../supabase/supabaseClient'
import './Dashboard.css'

const PAYTERM_OPTIONS = [
  { value: 'ALL', label: 'All pay terms' },
  { value: 'COD', label: 'COD' },
  { value: '30D', label: '30D' },
  { value: '45D', label: '45D' },
]

const YEAR_OPTIONS = Array.from({ length: 27 }, (_, index) => {
  const year = 2000 + index
  return { value: String(year), label: String(year) }
})

const VIEW_BY_OPTIONS = [
  { value: 'DAY', label: 'By Days' },
  { value: 'WEEK', label: 'By Weeks' },
  { value: 'MONTH', label: 'By Months' },
]

const toDateLabel = (dateLike) => {
  if (!dateLike) return 'N/A'
  const date = new Date(dateLike)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatIsoDate = (dateLike) => {
  if (!dateLike) return ''
  const date = new Date(dateLike)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

const parseSalesAmount = (row) => {
  const amount = Number(row?.totalamount || row?.total_amount || 0)
  if (Number.isFinite(amount) && amount > 0) return amount
  return 0
}

const downloadCsv = (filename, headers, rows) => {
  const safe = (value) => {
    const text = String(value ?? '')
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`
    }
    return text
  }

  const lines = [headers.join(','), ...rows.map((row) => row.map(safe).join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function Dashboard() {
  const { user } = useAuth()
  const { formatCurrency } = useCurrencyFormatter()
  const [paytermFilter, setPaytermFilter] = useState('ALL')
  const [selectedYear, setSelectedYear] = useState('2010')
  const [viewBy, setViewBy] = useState('MONTH')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exportNotice, setExportNotice] = useState('')
  const [customers, setCustomers] = useState([])
  const [sales, setSales] = useState([])
  const [userRows, setUserRows] = useState([])
  const [deletedCustomers, setDeletedCustomers] = useState([])
  const [auditPreview, setAuditPreview] = useState([])
  const [privilegedActivity, setPrivilegedActivity] = useState([])
  const [auditNotice, setAuditNotice] = useState('')
  const [openNotificationPanel, setOpenNotificationPanel] = useState(null)

  const currentRole = String(user?.user_type || 'USER').toUpperCase()
  const isAdminView = currentRole === 'ADMIN'
  const isSuperAdminView = currentRole === 'SUPERADMIN'
  const isPrivilegedView = isAdminView || isSuperAdminView

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError('')
        const [customerRows, salesRows] = await Promise.all([
          customerService.getCustomers(),
          getSales(),
        ])
        setCustomers(customerRows || [])
        setSales(salesRows || [])

        if (isPrivilegedView) {
          const [usersResult, deletedResult, auditResult] = await Promise.allSettled([
            supabase.from('user').select('userId, email, full_name, user_type, record_status').order('userId'),
            customerService.getDeletedCustomers(),
            getAuditLogs(8),
          ])

          if (usersResult.status === 'fulfilled') setUserRows(usersResult.value.data || [])
          else setUserRows([])

          if (deletedResult.status === 'fulfilled') setDeletedCustomers(deletedResult.value || [])
          else setDeletedCustomers([])

          if (auditResult.status === 'fulfilled') {
            const fullLogs = auditResult.value || []
            setPrivilegedActivity(fullLogs)
            setAuditPreview(
              fullLogs.filter((log) => {
                const action = String(log?.action || '').toLowerCase()
                const entity = String(log?.entity_type || '').toLowerCase()
                return (
                  action.includes('deactivate') ||
                  action.includes('activate') ||
                  action.includes('recover') ||
                  action.includes('role') ||
                  action.includes('rights') ||
                  action.includes('superadmin') ||
                  entity.includes('user') ||
                  entity.includes('rights')
                )
              })
            )
            setAuditNotice('')
          } else {
            setAuditPreview([])
            setPrivilegedActivity([])
            setAuditNotice(auditResult.reason?.message || 'Audit logs are not available yet.')
          }
        }
      } catch (err) {
        setError(err.message || 'Unable to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [isPrivilegedView])

  const selectedYearNum = Number(selectedYear)
  const safeYear = Number.isFinite(selectedYearNum) ? selectedYearNum : 2026

  const rangeStart = useMemo(() => new Date(safeYear, 0, 1, 0, 0, 0, 0), [safeYear])
  const rangeEnd = useMemo(() => new Date(safeYear, 11, 31, 23, 59, 59, 999), [safeYear])

  const customerMap = useMemo(() => {
    const map = new Map()
    for (const customer of customers) map.set(customer.custno, customer)
    return map
  }, [customers])

  const filteredCustomers = useMemo(() => {
    if (paytermFilter === 'ALL') return customers
    return customers.filter((customer) => String(customer.payterm || '').toUpperCase() === paytermFilter)
  }, [customers, paytermFilter])

  const filteredSales = useMemo(() => {
    return sales.filter((row) => {
      const date = new Date(row.salesdate)
      if (Number.isNaN(date.getTime()) || date < rangeStart || date > rangeEnd) return false
      if (paytermFilter === 'ALL') return true
      const customer = customerMap.get(row.custno)
      return String(customer?.payterm || '').toUpperCase() === paytermFilter
    })
  }, [sales, rangeStart, rangeEnd, customerMap, paytermFilter])

  const lineChartData = useMemo(() => {
    const bucket = new Map()
    if (viewBy === 'MONTH') {
      for (let month = 0; month < 12; month += 1) {
        const key = String(month + 1)
        bucket.set(key, {
          txCount: 0,
          salesAmount: 0,
          label: new Date(safeYear, month, 1).toLocaleDateString('en-US', { month: 'short' }),
        })
      }
    } else if (viewBy === 'WEEK') {
      for (let week = 1; week <= 53; week += 1) {
        const key = String(week)
        bucket.set(key, { txCount: 0, salesAmount: 0, label: `W${week}` })
      }
    } else {
      const daysCount = Math.ceil((rangeEnd - rangeStart) / (24 * 60 * 60 * 1000)) + 1
      for (let i = 0; i < daysCount; i += 1) {
        const day = new Date(rangeStart)
        day.setDate(rangeStart.getDate() + i)
        bucket.set(formatIsoDate(day), {
          txCount: 0,
          salesAmount: 0,
          label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        })
      }
    }

    for (const row of filteredSales) {
      const date = new Date(row.salesdate)
      const key = viewBy === 'MONTH'
        ? String(date.getMonth() + 1)
        : viewBy === 'WEEK'
          ? String(getWeekNumber(date))
          : formatIsoDate(date)

      if (!bucket.has(key)) continue
      const current = bucket.get(key)
      current.txCount += 1
      current.salesAmount += parseSalesAmount(row)
      bucket.set(key, current)
    }

    return Array.from(bucket.entries()).map(([, value]) => ({
      date: value.label,
      txCount: value.txCount,
      salesAmount: Number(value.salesAmount.toFixed(2)),
    }))
  }, [filteredSales, viewBy, safeYear, rangeStart, rangeEnd])

  const totalTransactions = filteredSales.length

  const dashboardCustomers = useMemo(() => {
    const currentYear = new Date().getFullYear()
    if (safeYear >= currentYear) return filteredCustomers

    const customersWithSalesInYear = new Set(filteredSales.map((row) => row.custno).filter(Boolean))
    return filteredCustomers.filter((customer) => customersWithSalesInYear.has(customer.custno))
  }, [filteredCustomers, filteredSales, safeYear])

  const dashboardCustomerCount = dashboardCustomers.length

  const totalSalesAmount = useMemo(
    () => filteredSales.reduce((sum, row) => sum + parseSalesAmount(row), 0),
    [filteredSales]
  )

  const uniqueProductsSold = useMemo(() => {
    const set = new Set()
    for (const row of filteredSales) {
      const productCode = row?.prodcode || row?.productcode
      if (productCode) set.add(productCode)
    }
    return set.size
  }, [filteredSales])

  const recentTransactions = useMemo(() => {
    return [...filteredSales]
      .sort((a, b) => new Date(b.salesdate) - new Date(a.salesdate))
      .slice(0, 8)
      .map((row) => {
        const customer = customerMap.get(row.custno)
        return {
          transNo: row.transno || 'N/A',
          salesDate: row.salesdate,
          customerName: customer?.custname || row?.customer?.custname || row.custno || 'Unknown',
          amount: parseSalesAmount(row),
        }
      })
  }, [filteredSales, customerMap])

  const newestCustomers = useMemo(() => {
    return [...filteredCustomers]
      .sort((a, b) => String(b.custno || '').localeCompare(String(a.custno || '')))
      .slice(0, 6)
  }, [filteredCustomers])

  const pendingUsersCount = useMemo(() => {
    return (userRows || []).filter(
      (u) => String(u.user_type).toUpperCase() === 'USER' && String(u.record_status).toUpperCase() !== 'ACTIVE'
    ).length
  }, [userRows])

  const alerts = useMemo(() => {
    const items = []
    if (error) items.push({ tone: 'danger', text: 'Some dashboard data failed to load. Try refresh.' })
    if (!loading && totalTransactions === 0) items.push({ tone: 'warning', text: `No transactions found for year ${safeYear}.` })
    if (!loading && dashboardCustomerCount < 5) items.push({ tone: 'info', text: 'Customer list is small. Check if import is complete.' })
    if (isPrivilegedView && auditNotice) items.push({ tone: 'warning', text: 'Audit preview is unavailable. Run latest audit migration.' })
    if (isSuperAdminView && pendingUsersCount > 0) items.push({ tone: 'danger', text: `${pendingUsersCount} USER account(s) pending activation.` })
    return items
  }, [error, loading, totalTransactions, safeYear, dashboardCustomerCount, isPrivilegedView, isSuperAdminView, auditNotice, pendingUsersCount])

  const adminStats = useMemo(() => {
    const users = userRows || []
    const activeStaff = users.filter((u) => String(u.user_type).toUpperCase() === 'USER' && String(u.record_status).toUpperCase() === 'ACTIVE').length
    const pendingUsers = users.filter((u) => String(u.user_type).toUpperCase() === 'USER' && String(u.record_status).toUpperCase() !== 'ACTIVE').length
    const activeAdmins = users.filter((u) => String(u.user_type).toUpperCase() === 'ADMIN' && String(u.record_status).toUpperCase() === 'ACTIVE').length

    return {
      activeStaff,
      pendingUsers,
      activeAdmins,
      deletedCustomers: deletedCustomers.length,
      totalUsers: users.length,
      superAdmins: users.filter((u) => String(u.user_type).toUpperCase() === 'SUPERADMIN').length,
    }
  }, [userRows, deletedCustomers])

  const superOverview = useMemo(() => {
    const openAlerts = [
      adminStats.pendingUsers > 0,
      Boolean(error),
      Boolean(auditNotice),
    ].filter(Boolean).length
    return {
      systemHealth: error ? 'Attention' : 'Healthy',
      openAlerts,
      recentLogins: (userRows || []).filter((u) => String(u.record_status).toUpperCase() === 'ACTIVE').length,
      totalRolesTracked: 3,
    }
  }, [error, userRows, adminStats.pendingUsers, auditNotice])

  const pendingActivationRows = useMemo(() => {
    return (userRows || [])
      .filter((u) => String(u.user_type).toUpperCase() === 'USER' && String(u.record_status).toUpperCase() !== 'ACTIVE')
      .slice(0, 8)
  }, [userRows])

  const statusBreakdown = useMemo(() => {
    const active = dashboardCustomerCount
    const inactive = deletedCustomers.length
    const withSales = dashboardCustomers.filter((customer) =>
      filteredSales.some((sale) => sale.custno === customer.custno && parseSalesAmount(sale) > 0)
    ).length
    const withoutSales = Math.max(0, active - withSales)
    return [
      { name: 'Active', value: active, color: '#22c55e' },
      { name: 'With Sales', value: withSales, color: '#3b82f6' },
      { name: 'No Sales', value: withoutSales, color: '#f59e0b' },
      { name: 'Inactive', value: inactive, color: '#ef4444' },
    ].filter((x) => x.value > 0)
  }, [dashboardCustomerCount, dashboardCustomers, deletedCustomers.length, filteredSales])

  const priorities = useMemo(() => {
    const overdue = pendingActivationRows.length
    const needingFollowup = recentTransactions.filter((tx) => tx.amount <= 0).length
    const noSalesCustomers = Math.max(0, filteredCustomers.length - statusBreakdown.find((s) => s.name === 'With Sales')?.value || 0)
    return [
      { label: 'Pending USER activation', count: overdue, tone: 'danger' },
      { label: 'Transactions with missing amount', count: needingFollowup, tone: 'warning' },
      { label: 'Customers without sales', count: noSalesCustomers, tone: 'info' },
    ]
  }, [pendingActivationRows.length, recentTransactions, filteredCustomers.length, statusBreakdown])

  const greetingName = buildActorSnapshot({ authUser: user, userRole: currentRole }).name
  const reminderItems = isSuperAdminView
    ? ['Review ADMIN actions from audit feed every day.', 'Prioritize pending USER activations before noon.', 'Check deleted customers for valid recovery requests.']
    : isAdminView
      ? ['Check pending account activations in Admin module.', 'Review deleted customers before recovery requests pile up.', 'Use customer filters to monitor active accounts.']
      : ['Review recent transactions before end of day.', 'Use filters to focus on your assigned pay term groups.', 'Check Customer page for profile-level sales details.']

  const handleExportCsv = () => {
    const rows = recentTransactions.map((item) => [
      item.transNo,
      toDateLabel(item.salesDate),
      item.customerName,
      item.amount.toFixed(2),
    ])
    downloadCsv('dashboard_recent_transactions.csv', ['Transaction No', 'Date', 'Customer', 'Amount'], rows)
    setExportNotice('CSV exported: recent transactions.')
    window.setTimeout(() => setExportNotice(''), 2600)
  }

  return (
    <div className="user-dashboard-shell">
      <section className="user-dashboard">
        <header className="user-dashboard-header">
          <div className="user-dashboard-title-wrap">
            <p className="user-dashboard-greeting">Good day, {greetingName}</p>
            <h1 className="user-dashboard-title">{isSuperAdminView ? 'Superadmin Dashboard' : isAdminView ? 'Admin Dashboard' : 'Staff Dashboard'}</h1>
            <p className="user-dashboard-subtitle">
              {isSuperAdminView
                ? 'Full oversight of users, admins, customers, audit trail, and system risks.'
                : isAdminView
                ? 'Admin operations view for staff activation, monitoring, and customer activity.'
                : 'Focused view for active customers, transactions, and daily follow-ups.'}
            </p>
          </div>
          <div className="user-dashboard-header-right">
            <span className="user-role-badge">{isSuperAdminView ? 'SUPERADMIN' : isAdminView ? 'ADMIN' : 'USER'}</span>
            <span className="user-date-chip"><CalendarDays size={14} /> {new Date().toLocaleDateString()}</span>
          </div>
        </header>

        <div className="user-dashboard-toolbar">
          <FilterDropdown value={selectedYear} onChange={setSelectedYear} options={YEAR_OPTIONS} label="Year" />
          <FilterDropdown value={viewBy} onChange={setViewBy} options={VIEW_BY_OPTIONS} label="View by" />
          <FilterDropdown value={paytermFilter} onChange={setPaytermFilter} options={PAYTERM_OPTIONS} label="Pay term" />
          <button type="button" className="dashboard-export-btn" onClick={handleExportCsv}>
            <Download size={14} /> Export CSV
          </button>
          <button type="button" className="dashboard-export-btn ghost" title="PDF export will be enabled in the next phase.">
            PDF Soon
          </button>
        </div>

        {exportNotice && <div className="dashboard-notice">{exportNotice}</div>}
        {error && <div className="dashboard-error">{error}</div>}

        <section className="dashboard-focus-grid">
          {!isPrivilegedView && (
            <>
              <article className="dashboard-card focus-card wide-focus">
                <div className="dashboard-card-head">
                  <h2>Recent Transactions</h2>
                  <Link to="/sales" className="dashboard-head-link">Open Sales <ArrowRight size={13} /></Link>
                </div>
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Trans No</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.length === 0 ? (
                        <tr><td colSpan={4} className="empty-cell">No transactions in selected range.</td></tr>
                      ) : (
                        recentTransactions.slice(0, 5).map((item) => (
                          <tr key={`focus-${item.transNo}-${item.salesDate}`}>
                            <td>{item.transNo}</td>
                            <td>{toDateLabel(item.salesDate)}</td>
                            <td>{item.customerName}</td>
                            <td className="money">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="dashboard-card focus-card">
                <div className="dashboard-card-head">
                  <h2>Daily Shortcuts</h2>
                </div>
                <div className="quick-actions">
                  <Link to="/customers" className="quick-action">View Customers <ArrowRight size={14} /></Link>
                  <Link to="/sales" className="quick-action">View Sales <ArrowRight size={14} /></Link>
                  <Link to="/products" className="quick-action">View Products <ArrowRight size={14} /></Link>
                </div>
              </article>
            </>
          )}

          {isAdminView && (
            <>
              <article className="dashboard-card focus-card">
                <div className="dashboard-card-head">
                  <h2>Admin Priorities</h2>
                  <Link to="/admin" className="dashboard-head-link">Manage <ArrowRight size={13} /></Link>
                </div>
                <div className="priority-list">
                  {priorities.map((item) => (
                    <div key={`admin-${item.label}`} className={`priority-item ${item.tone}`}>
                      <span>{item.label}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="dashboard-card focus-card">
                <div className="dashboard-card-head">
                  <h2>Account Queue</h2>
                </div>
                <div className="priority-list">
                  <div className="priority-item warning"><span>Pending USER activation</span><strong>{adminStats.pendingUsers}</strong></div>
                  <div className="priority-item info"><span>Active Staff</span><strong>{adminStats.activeStaff}</strong></div>
                  <div className="priority-item danger"><span>Deleted Customers</span><strong>{adminStats.deletedCustomers}</strong></div>
                </div>
              </article>

              <article className="dashboard-card focus-card">
                <div className="dashboard-card-head">
                  <h2>Admin Shortcuts</h2>
                </div>
                <div className="quick-actions">
                  <Link to="/admin" className="quick-action">Manage Users <ArrowRight size={14} /></Link>
                  <Link to="/deleted-customers" className="quick-action">Review Deleted Customers <ArrowRight size={14} /></Link>
                  <Link to="/customers" className="quick-action">Customer Directory <ArrowRight size={14} /></Link>
                </div>
              </article>
            </>
          )}

          {isSuperAdminView && (
            <>
              <article className="dashboard-card focus-card">
                <div className="dashboard-card-head">
                  <h2>System Overview</h2>
                  <Link to="/audit-logs" className="dashboard-head-link">Audit Logs <ArrowRight size={13} /></Link>
                </div>
                <div className="priority-list">
                  <div className="priority-item info"><span>System Health</span><strong>{superOverview.systemHealth}</strong></div>
                  <div className="priority-item warning"><span>Recent Active Logins</span><strong>{superOverview.recentLogins}</strong></div>
                  <div className="priority-item danger"><span>Open Alerts</span><strong>{superOverview.openAlerts}</strong></div>
                </div>
              </article>

              <article className="dashboard-card focus-card">
                <div className="dashboard-card-head">
                  <h2>Security Watch</h2>
                </div>
                {auditNotice ? (
                  <div className="alert-item warning">{auditNotice}</div>
                ) : (
                  <div className="mini-list">
                    {auditPreview.length === 0 ? (
                      <div className="alert-item info">No flagged audit entries.</div>
                    ) : (
                      auditPreview.slice(0, 4).map((log) => (
                        <div className="mini-list-item static" key={`focus-${log.id || `${log.actor_user_id}-${log.created_at}`}`}>
                          <span>{log.action || 'Action logged'}</span>
                          <small>{log.actor_email || log.actor_user_id || 'Unknown'} - {toDateLabel(log.created_at)}</small>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </article>

              <article className="dashboard-card focus-card">
                <div className="dashboard-card-head">
                  <h2>Superadmin Shortcuts</h2>
                </div>
                <div className="quick-actions">
                  <Link to="/admin" className="quick-action">Manage Users <ArrowRight size={14} /></Link>
                  <Link to="/audit-logs" className="quick-action">Open Audit Logs <ArrowRight size={14} /></Link>
                  <Link to="/deleted-customers" className="quick-action">Deleted Customers <ArrowRight size={14} /></Link>
                </div>
              </article>
            </>
          )}
        </section>

        <section className="dashboard-notifications-grid">
          <button
            type="button"
            className="dashboard-notification-trigger alerts"
            onClick={() => setOpenNotificationPanel('alerts')}
          >
            <span className="notification-trigger-icon"><Bell size={17} /></span>
            <span className="notification-trigger-copy">
              <strong>Notifications</strong>
              <small>{alerts.length || 'No'} active alert{alerts.length === 1 ? '' : 's'}</small>
            </span>
            <ArrowRight size={15} />
          </button>

          <button
            type="button"
            className="dashboard-notification-trigger reminders"
            onClick={() => setOpenNotificationPanel('reminders')}
          >
            <span className="notification-trigger-icon"><AlertTriangle size={17} /></span>
            <span className="notification-trigger-copy">
              <strong>Reminders</strong>
              <small>{reminderItems.length} role-specific note{reminderItems.length === 1 ? '' : 's'}</small>
            </span>
            <ArrowRight size={15} />
          </button>
        </section>

        {openNotificationPanel && (
          <div className="dashboard-modal-overlay" onClick={() => setOpenNotificationPanel(null)}>
            <section className="dashboard-notification-modal" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                className="dashboard-modal-close"
                onClick={() => setOpenNotificationPanel(null)}
                aria-label="Close notifications"
              >
                <X size={17} />
              </button>

              <div className="dashboard-modal-head">
                <span className="notification-trigger-icon">
                  {openNotificationPanel === 'alerts' ? <Bell size={18} /> : <AlertTriangle size={18} />}
                </span>
                <div>
                  <h2>{openNotificationPanel === 'alerts' ? 'Important Notifications' : 'Helpful Reminders'}</h2>
                  <p>{openNotificationPanel === 'alerts' ? 'Current dashboard alerts that need attention.' : 'Role-specific reminders for today.'}</p>
                </div>
              </div>

              {openNotificationPanel === 'alerts' ? (
                <div className="alert-list modal-list">
                  {alerts.length === 0 ? (
                    <div className="alert-item info">No active dashboard notifications.</div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={`modal-notification-${alert.text}`} className={`alert-item ${alert.tone}`}>{alert.text}</div>
                    ))
                  )}
                </div>
              ) : (
                <ul className="reminders modal-reminders">
                  {reminderItems.map((item) => <li key={`modal-${item}`}>{item}</li>)}
                </ul>
              )}
            </section>
          </div>
        )}

        <section className="dashboard-kpi-grid">
          <article className="dashboard-kpi-card kpi-tone-customers">
            <div className="dashboard-kpi-icon"><Users size={16} /></div>
            <span className="dashboard-kpi-label">Active Customers</span>
            <strong className="dashboard-kpi-value">{dashboardCustomerCount}</strong>
          </article>
          <article className="dashboard-kpi-card kpi-tone-transactions">
            <div className="dashboard-kpi-icon"><ShoppingCart size={16} /></div>
            <span className="dashboard-kpi-label">Transactions</span>
            <strong className="dashboard-kpi-value">{totalTransactions}</strong>
          </article>
          <article className="dashboard-kpi-card kpi-tone-sales">
            <div className="dashboard-kpi-icon"><Wallet size={16} /></div>
            <span className="dashboard-kpi-label">Sales Amount</span>
            <strong className="dashboard-kpi-value">{formatCurrency(totalSalesAmount)}</strong>
          </article>
          <article className="dashboard-kpi-card kpi-tone-products">
            <div className="dashboard-kpi-icon"><ShoppingBag size={16} /></div>
            <span className="dashboard-kpi-label">Unique Products</span>
            <strong className="dashboard-kpi-value">{uniqueProductsSold}</strong>
          </article>

          {isPrivilegedView && (
            <>
              <article className="dashboard-kpi-card kpi-tone-staff">
                <div className="dashboard-kpi-icon"><Users size={16} /></div>
                <span className="dashboard-kpi-label">Active Staff (USER)</span>
                <strong className="dashboard-kpi-value">{adminStats.activeStaff}</strong>
              </article>
              <article className="dashboard-kpi-card kpi-tone-pending">
                <div className="dashboard-kpi-icon"><AlertTriangle size={16} /></div>
                <span className="dashboard-kpi-label">Pending Activation</span>
                <strong className="dashboard-kpi-value">{adminStats.pendingUsers}</strong>
              </article>
              <article className="dashboard-kpi-card kpi-tone-admins">
                <div className="dashboard-kpi-icon"><Users size={16} /></div>
                <span className="dashboard-kpi-label">Active Admins</span>
                <strong className="dashboard-kpi-value">{adminStats.activeAdmins}</strong>
              </article>
              <article className="dashboard-kpi-card kpi-tone-deleted">
                <div className="dashboard-kpi-icon"><ShoppingBag size={16} /></div>
                <span className="dashboard-kpi-label">Deleted Customers</span>
                <strong className="dashboard-kpi-value">{adminStats.deletedCustomers}</strong>
              </article>
              {isSuperAdminView && (
                <>
                  <article className="dashboard-kpi-card kpi-tone-users">
                    <div className="dashboard-kpi-icon"><Users size={16} /></div>
                    <span className="dashboard-kpi-label">Total Users</span>
                    <strong className="dashboard-kpi-value">{adminStats.totalUsers}</strong>
                  </article>
                  <article className="dashboard-kpi-card kpi-tone-alerts">
                    <div className="dashboard-kpi-icon"><AlertTriangle size={16} /></div>
                    <span className="dashboard-kpi-label">Security Alerts</span>
                    <strong className="dashboard-kpi-value">{superOverview.openAlerts}</strong>
                  </article>
                </>
              )}
            </>
          )}
        </section>

        <section className="dashboard-main-grid secondary-section">
          <article className="dashboard-card chart-card">
            <div className="dashboard-card-head">
              <h2><LineChartIcon size={16} /> Sales Trend</h2>
              <span className="chart-range-label">{safeYear} - {VIEW_BY_OPTIONS.find((x) => x.value === viewBy)?.label}</span>
            </div>
            {loading ? (
              <div className="dashboard-loading"><Loader2 className="spin" size={20} /> Loading chart...</div>
            ) : (
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 8, right: 14, bottom: 0, left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(126,184,255,0.18)" />
                    <XAxis dataKey="date" stroke="rgba(180,210,255,0.58)" tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(180,210,255,0.58)" tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(10, 20, 40, 0.96)',
                        border: '1px solid rgba(126,184,255,0.28)',
                        borderRadius: '10px',
                        color: '#e5f0ff',
                      }}
                    />
                    <Line type="monotone" dataKey="txCount" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 2.5 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>
        </section>

        {isPrivilegedView && (
          <section className="dashboard-admin-analytics-grid">
            <article className="dashboard-card">
              <div className="dashboard-card-head">
                <h2>Team Performance</h2>
              </div>
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Status</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(userRows || []).filter((u) => String(u.user_type).toUpperCase() === 'USER').slice(0, 6).map((u) => (
                      <tr key={u.userId}>
                        <td>{u.full_name || u.email || u.userId}</td>
                        <td>{u.record_status}</td>
                        <td>{u.user_type}</td>
                      </tr>
                    ))}
                    {(userRows || []).filter((u) => String(u.user_type).toUpperCase() === 'USER').length === 0 && (
                      <tr><td colSpan={3} className="empty-cell">No staff rows found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="dashboard-card">
              <div className="dashboard-card-head">
                <h2>Customer Overview</h2>
              </div>
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Payterm</th>
                      <th>Recent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newestCustomers.slice(0, 6).map((customer) => {
                      const latestTx = recentTransactions.find((tx) => tx.customerName === (customer.custname || customer.custno))
                      return (
                        <tr key={customer.custno}>
                          <td>{customer.custname || customer.custno}</td>
                          <td>{customer.payterm || 'N/A'}</td>
                          <td>{latestTx ? toDateLabel(latestTx.salesDate) : 'No tx'}</td>
                        </tr>
                      )
                    })}
                    {newestCustomers.length === 0 && (
                      <tr><td colSpan={3} className="empty-cell">No customer records.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="dashboard-card">
              <div className="dashboard-card-head">
                <h2>Customer Status Breakdown</h2>
              </div>
              <div className="donut-wrap neon">
                <ResponsiveContainer width="100%" height={245}>
                  <PieChart>
                    <Pie data={statusBreakdown} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2} stroke="rgba(9,16,36,0.8)" strokeWidth={2}>
                      {statusBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                      <Label
                        position="center"
                        content={({ viewBox }) => {
                          if (!viewBox) return null
                          const total = statusBreakdown.reduce((sum, item) => sum + item.value, 0)
                          return (
                            <g>
                              <text x={viewBox.cx} y={viewBox.cy - 4} textAnchor="middle" fill="rgba(235,245,255,0.96)" fontSize="27" fontWeight="800">
                                {total}
                              </text>
                              <text x={viewBox.cx} y={viewBox.cy + 20} textAnchor="middle" fill="rgba(180,210,255,0.7)" fontSize="12">
                                total customers
                              </text>
                            </g>
                          )
                        }}
                      />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(10, 20, 40, 0.96)',
                        border: '1px solid rgba(126,184,255,0.28)',
                        borderRadius: '10px',
                        color: '#e5f0ff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="legend-list">
                  {statusBreakdown.map((item) => (
                    <div className="legend-item" key={item.name}>
                      <span className="legend-dot" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </section>
        )}

        {isSuperAdminView && (
          <section className="dashboard-super-grid">
            <article className="dashboard-card">
              <div className="dashboard-card-head">
                <h2>Recent Privileged Activity</h2>
              </div>
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {privilegedActivity.length === 0 ? (
                      <tr><td colSpan={3} className="empty-cell">No privileged activity found.</td></tr>
                    ) : (
                      privilegedActivity.slice(0, 6).map((log) => (
                        <tr key={log.id || `${log.actor_user_id}-${log.created_at}`}>
                          <td>{log.actor_email || log.actor_user_id || 'Unknown'}</td>
                          <td>{log.action || 'Action logged'}</td>
                          <td>{toDateLabel(log.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        )}
      </section>
    </div>
  )
}

export default Dashboard
