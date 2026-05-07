import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Boxes,
  CircleDollarSign,
  Database,
  Loader2,
  ShieldCheck,
  ShoppingCart,
  UserCheck,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { getProducts } from '../../services/salesProductApi'
import { supabase } from '../../supabase/supabaseClient'

function Dashboard() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [salesCount, setSalesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setLoading(true)
        setError('')

        const [customerRows, productRows, salesResult] = await Promise.all([
          supabase.from('customer').select('*'),
          getProducts(),
          supabase.from('sales').select('transno', { count: 'exact', head: true }),
        ])

        if (customerRows.error) throw customerRows.error
        if (salesResult.error) throw salesResult.error

        setCustomers(customerRows.data || [])
        setProducts(productRows || [])
        setSalesCount(salesResult.count || 0)
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err)
        setError('Unable to load dashboard statistics.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardStats()
  }, [])

  const stats = useMemo(() => {
    const normalizeStatus = (value) => String(value || '').toUpperCase()
    const activeCustomers = customers.filter((customer) => normalizeStatus(customer.record_status) === 'ACTIVE').length
    const inactiveCustomers = customers.filter((customer) => normalizeStatus(customer.record_status) === 'INACTIVE').length
    const prices = products.map((product) => product.pricehist?.[0]?.unitprice || 0)
    const highestPrice = Math.max(0, ...prices)
    const averagePrice = prices.length
      ? prices.reduce((total, price) => total + price, 0) / prices.length
      : 0
    const activeRate = customers.length ? Math.round((activeCustomers / customers.length) * 100) : 0
    const catalogueCoverage = products.length ? Math.round((prices.filter(Boolean).length / products.length) * 100) : 0

    return {
      totalCustomers: customers.length,
      activeCustomers,
      inactiveCustomers,
      productCount: products.length,
      salesCount,
      highestPrice,
      averagePrice,
      activeRate,
      catalogueCoverage,
    }
  }, [customers, products, salesCount])

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    }).format(value)

  const statCards = [
    {
      label: 'Customers',
      value: stats.totalCustomers,
      detail: `${stats.activeCustomers} active`,
      icon: Users,
      tone: 'blue',
    },
    {
      label: 'Products',
      value: stats.productCount,
      detail: 'catalogue items',
      icon: Boxes,
      tone: 'violet',
    },
    {
      label: 'Sales',
      value: stats.salesCount,
      detail: 'transactions',
      icon: ShoppingCart,
      tone: 'cyan',
    },
    {
      label: 'Avg. Price',
      value: formatCurrency(stats.averagePrice),
      detail: `high ${formatCurrency(stats.highestPrice)}`,
      icon: CircleDollarSign,
      tone: 'green',
    },
  ]

  const healthItems = [
    { label: 'Active customer ratio', value: stats.activeRate, icon: UserCheck },
    { label: 'Priced product coverage', value: stats.catalogueCoverage, icon: Database },
    { label: 'Inactive recovery queue', value: stats.totalCustomers ? Math.round((stats.inactiveCustomers / stats.totalCustomers) * 100) : 0, icon: AlertCircle },
  ]

  return (
    <>
      <style>{`
        @keyframes dashboardIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dashboard-page {
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
          animation: dashboardIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .dashboard-shell {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 310px;
          gap: 14px;
        }

        .dashboard-main,
        .dashboard-side {
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .glass-panel {
          border: 1px solid rgba(150, 190, 255, 0.14);
          background: linear-gradient(145deg, rgba(12, 24, 44, 0.72), rgba(9, 18, 34, 0.52));
          box-shadow: 0 20px 44px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(22px) saturate(135%);
          -webkit-backdrop-filter: blur(22px) saturate(135%);
          border-radius: 18px;
          overflow: hidden;
        }

        .dashboard-hero {
          min-height: 188px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 230px;
          gap: 18px;
          padding: 18px;
        }

        .hero-copy {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
        }

        .hero-kicker {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          gap: 7px;
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid rgba(110, 231, 183, 0.18);
          background: rgba(16, 185, 129, 0.1);
          color: rgba(167, 243, 208, 0.92);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hero-title {
          margin: 18px 0 8px;
          color: rgba(246, 250, 255, 0.98);
          font-size: 30px;
          line-height: 1.05;
          font-weight: 850;
        }

        .hero-subtitle {
          max-width: 560px;
          margin: 0;
          color: rgba(203, 224, 255, 0.5);
          font-size: 13px;
          line-height: 1.6;
        }

        .hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 18px;
        }

        .hero-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 32px;
          padding: 0 10px;
          border-radius: 10px;
          border: 1px solid rgba(150, 190, 255, 0.13);
          background: rgba(4, 12, 26, 0.32);
          color: rgba(211, 230, 255, 0.72);
          font-size: 11px;
          font-weight: 700;
        }

        .hero-orbit {
          position: relative;
          min-height: 152px;
          border-radius: 16px;
          border: 1px solid rgba(150, 190, 255, 0.13);
          background:
            linear-gradient(160deg, rgba(28, 49, 76, 0.78), rgba(10, 21, 37, 0.58)),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 32px);
          overflow: hidden;
        }

        .hero-meter {
          position: absolute;
          inset: 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .meter-label {
          color: rgba(203, 224, 255, 0.52);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .meter-value {
          color: white;
          font-size: 42px;
          line-height: 1;
          font-weight: 850;
          font-variant-numeric: tabular-nums;
        }

        .meter-track {
          height: 9px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }

        .meter-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #38bdf8, #34d399);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .stat-card {
          min-height: 122px;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid rgba(150, 190, 255, 0.12);
          background: rgba(8, 18, 34, 0.58);
          backdrop-filter: blur(16px);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.22);
        }

        .stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .stat-label {
          color: rgba(203, 224, 255, 0.42);
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .stat-icon {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          border: 1px solid rgba(125, 211, 252, 0.16);
          background: rgba(14, 165, 233, 0.1);
          color: rgba(125, 211, 252, 0.95);
          flex-shrink: 0;
        }

        .stat-value {
          margin-top: 20px;
          color: rgba(248, 252, 255, 0.98);
          font-size: 25px;
          line-height: 1;
          font-weight: 850;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .stat-detail {
          margin-top: 8px;
          color: rgba(203, 224, 255, 0.48);
          font-size: 12px;
        }

        .stat-card.violet .stat-icon { color: rgba(196, 181, 253, 0.95); background: rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.18); }
        .stat-card.cyan .stat-icon { color: rgba(103, 232, 249, 0.95); background: rgba(6, 182, 212, 0.1); border-color: rgba(6, 182, 212, 0.18); }
        .stat-card.green .stat-icon { color: rgba(134, 239, 172, 0.95); background: rgba(34, 197, 94, 0.1); border-color: rgba(34, 197, 94, 0.18); }

        .health-panel {
          flex: 1;
          min-height: 0;
          padding: 16px;
        }

        .panel-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .panel-title h2 {
          margin: 0;
          color: rgba(246, 250, 255, 0.94);
          font-size: 14px;
          font-weight: 850;
        }

        .panel-title span {
          color: rgba(203, 224, 255, 0.36);
          font-size: 11px;
          font-weight: 700;
        }

        .health-list {
          display: grid;
          gap: 12px;
        }

        .health-row {
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr) 46px;
          align-items: center;
          gap: 10px;
        }

        .health-icon {
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: rgba(96, 165, 250, 0.1);
          color: rgba(147, 197, 253, 0.9);
        }

        .health-name {
          display: block;
          color: rgba(225, 239, 255, 0.82);
          font-size: 12px;
          font-weight: 750;
        }

        .health-track {
          height: 7px;
          margin-top: 7px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        .health-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #60a5fa, #34d399);
        }

        .health-value {
          color: rgba(235, 245, 255, 0.9);
          font-size: 12px;
          font-weight: 850;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .side-card {
          padding: 15px;
        }

        .role-card {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .role-icon {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(34, 197, 94, 0.11);
          color: rgba(134, 239, 172, 0.95);
          border: 1px solid rgba(34, 197, 94, 0.18);
          flex-shrink: 0;
        }

        .role-label {
          display: block;
          color: rgba(203, 224, 255, 0.38);
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .role-value {
          display: block;
          margin-top: 4px;
          color: rgba(248, 252, 255, 0.95);
          font-size: 15px;
          font-weight: 850;
        }

        .mini-stack {
          display: grid;
          gap: 10px;
        }

        .mini-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 11px 0;
          border-bottom: 1px solid rgba(150, 190, 255, 0.08);
        }

        .mini-row:last-child {
          border-bottom: none;
        }

        .mini-label {
          color: rgba(203, 224, 255, 0.46);
          font-size: 12px;
          font-weight: 700;
        }

        .mini-value {
          color: rgba(248, 252, 255, 0.92);
          font-size: 13px;
          font-weight: 850;
          font-variant-numeric: tabular-nums;
        }

        .dashboard-state {
          flex: 1;
          min-height: 360px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(203, 224, 255, 0.42);
          font-size: 13px;
          text-align: center;
        }

        @media (max-width: 1180px) {
          .dashboard-shell {
            grid-template-columns: 1fr;
          }

          .dashboard-side {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 920px) {
          .dashboard-hero,
          .stats-grid,
          .dashboard-side {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            display: grid;
          }
        }

        @media (max-width: 680px) {
          .dashboard-hero {
            padding: 14px;
          }

          .hero-title {
            font-size: 24px;
          }

          .stat-value {
            font-size: 22px;
          }
        }
      `}</style>

      <div className="dashboard-page">
        {loading ? (
          <div className="dashboard-state glass-panel">
            <div>
              <Loader2 className="animate-spin mb-3 mx-auto text-blue-400" size={30} />
              <p>Loading dashboard statistics...</p>
            </div>
          </div>
        ) : error ? (
          <div className="dashboard-state glass-panel">{error}</div>
        ) : (
          <div className="dashboard-shell">
            <main className="dashboard-main">
              <section className="dashboard-hero glass-panel">
                <div className="hero-copy">
                  <div>
                    <div className="hero-kicker">
                      <ShieldCheck size={13} />
                      HopeCMS overview
                    </div>
                    <h1 className="hero-title">Customer Management Statistics</h1>
                    <p className="hero-subtitle">
                      Live operating snapshot for customer records, sales visibility, and read-only product catalogue pricing.
                    </p>
                  </div>
                  <div className="hero-meta">
                    <span className="hero-chip"><Users size={13} /> {stats.totalCustomers} customers</span>
                    <span className="hero-chip"><ShoppingCart size={13} /> {stats.salesCount} sales</span>
                    <span className="hero-chip"><Boxes size={13} /> {stats.productCount} products</span>
                  </div>
                </div>

                <div className="hero-orbit">
                  <div className="hero-meter">
                    <span className="meter-label">Active Customers</span>
                    <span className="meter-value">{stats.activeRate}%</span>
                    <div>
                      <div className="meter-track">
                        <div className="meter-fill" style={{ width: `${stats.activeRate}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="stats-grid">
                {statCards.map((card) => {
                  const Icon = card.icon
                  return (
                    <article className={`stat-card ${card.tone}`} key={card.label}>
                      <div className="stat-top">
                        <span className="stat-label">{card.label}</span>
                        <span className="stat-icon"><Icon size={17} /></span>
                      </div>
                      <div className="stat-value">{card.value}</div>
                      <div className="stat-detail">{card.detail}</div>
                    </article>
                  )
                })}
              </section>

              <section className="health-panel glass-panel">
                <div className="panel-title">
                  <h2>System Health</h2>
                  <span>record coverage</span>
                </div>
                <div className="health-list">
                  {healthItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <div className="health-row" key={item.label}>
                        <span className="health-icon"><Icon size={15} /></span>
                        <div>
                          <span className="health-name">{item.label}</span>
                          <div className="health-track">
                            <div className="health-fill" style={{ width: `${item.value}%` }} />
                          </div>
                        </div>
                        <span className="health-value">{item.value}%</span>
                      </div>
                    )
                  })}
                </div>
              </section>
            </main>

            <aside className="dashboard-side">
              <section className="side-card glass-panel">
                <div className="role-card">
                  <span className="role-icon"><ShieldCheck size={18} /></span>
                  <div>
                    <span className="role-label">Current Access</span>
                    <span className="role-value">{user?.user_type || 'USER'}</span>
                  </div>
                </div>
              </section>

              <section className="side-card glass-panel">
                <div className="panel-title">
                  <h2>Record Summary</h2>
                  <span>counts</span>
                </div>
                <div className="mini-stack">
                  <div className="mini-row">
                    <span className="mini-label">Active customers</span>
                    <span className="mini-value">{stats.activeCustomers}</span>
                  </div>
                  <div className="mini-row">
                    <span className="mini-label">Inactive customers</span>
                    <span className="mini-value">{stats.inactiveCustomers}</span>
                  </div>
                  <div className="mini-row">
                    <span className="mini-label">Highest price</span>
                    <span className="mini-value">{formatCurrency(stats.highestPrice)}</span>
                  </div>
                  <div className="mini-row">
                    <span className="mini-label">Average price</span>
                    <span className="mini-value">{formatCurrency(stats.averagePrice)}</span>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </>
  )
}

export default Dashboard
