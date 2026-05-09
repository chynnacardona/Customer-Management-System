import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Boxes,
  CircleDollarSign,
  Database,
  Loader2,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { useRights } from '../../context/useRights'
import { getProducts } from '../../services/salesProductApi'
import { supabase } from '../../supabase/supabaseClient'

const currency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
})

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function Dashboard() {
  const { user } = useAuth()
  const { rights } = useRights()
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
      } catch {
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
    const prices = products.map((product) => Number(product.pricehist?.[0]?.unitprice || 0))
    const pricedProducts = prices.filter((price) => price > 0)
    const highestPrice = Math.max(0, ...prices)
    const lowestPrice = pricedProducts.length ? Math.min(...pricedProducts) : 0
    const averagePrice = prices.length ? prices.reduce((total, price) => total + price, 0) / prices.length : 0
    const activeRate = customers.length ? Math.round((activeCustomers / customers.length) * 100) : 0
    const catalogueCoverage = products.length ? Math.round((pricedProducts.length / products.length) * 100) : 0
    const missingPayterm = customers.filter((customer) => !customer.payterm).length
    const unpricedProducts = products.length - pricedProducts.length
    const salesPerCustomer = customers.length ? salesCount / customers.length : 0

    return {
      activeCustomers,
      activeRate,
      averagePrice,
      catalogueCoverage,
      highestPrice,
      inactiveCustomers,
      lowestPrice,
      missingPayterm,
      pricedProducts: pricedProducts.length,
      productCount: products.length,
      salesCount,
      salesPerCustomer,
      totalCustomers: customers.length,
      unpricedProducts,
    }
  }, [customers, products, salesCount])

  const payterms = useMemo(() => {
    const counts = customers.reduce((acc, customer) => {
      const key = customer.payterm || 'N/A'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    return ['COD', '30D', '45D']
      .map((label) => ({
        label,
        value: counts[label] || 0,
        percent: customers.length ? Math.round(((counts[label] || 0) / customers.length) * 100) : 0,
      }))
      .filter((item) => item.value > 0)
  }, [customers])

  const statCards = [
    { label: 'Customers', value: stats.totalCustomers, detail: `${stats.activeCustomers} active`, icon: Users, tone: 'blue' },
    { label: 'Sales', value: stats.salesCount, detail: 'transactions', icon: ShoppingCart, tone: 'cyan' },
    { label: 'Products', value: stats.productCount, detail: 'catalogue rows', icon: Boxes, tone: 'violet' },
    { label: 'Avg. Price', value: currency.format(stats.averagePrice), detail: `high ${currency.format(stats.highestPrice)}`, icon: CircleDollarSign, tone: 'green' },
  ]

  const healthItems = [
    { label: 'Active customer ratio', value: stats.activeRate, icon: UserCheck },
    { label: 'Priced catalogue', value: stats.catalogueCoverage, icon: Database },
    {
      label: 'Recovery pressure',
      value: stats.totalCustomers ? Math.round((stats.inactiveCustomers / stats.totalCustomers) * 100) : 0,
      icon: AlertCircle,
    },
  ]

  const readinessScore = Math.round(
    (stats.activeRate + stats.catalogueCoverage + (stats.missingPayterm === 0 ? 100 : 70) + (stats.unpricedProducts === 0 ? 100 : 70)) / 4
  )

  const signalRows = [
    { label: 'Readiness', value: `${readinessScore}%`, hint: 'overall data health', width: readinessScore },
    { label: 'Risk', value: stats.inactiveCustomers || stats.unpricedProducts || stats.missingPayterm ? 'Watch' : 'Clear', hint: 'quality flags', width: stats.inactiveCustomers || stats.unpricedProducts || stats.missingPayterm ? 62 : 100 },
    { label: 'Access', value: rights.ADM_USER === 1 ? 'Privileged' : 'Standard', hint: 'current session', width: rights.ADM_USER === 1 ? 100 : 58 },
  ]

  const accessRows = [
    { label: 'Add', value: rights.CUST_ADD === 1 ? 'Allowed' : 'Blocked' },
    { label: 'Edit', value: rights.CUST_EDIT === 1 ? 'Allowed' : 'Blocked' },
    { label: 'Delete', value: rights.CUST_DEL === 1 ? 'Allowed' : 'SUPERADMIN' },
    { label: 'Admin', value: rights.ADM_USER === 1 ? 'Allowed' : 'Blocked' },
  ]

  const accessScore = Math.round(
    (['CUST_ADD', 'CUST_EDIT', 'CUST_DEL', 'ADM_USER'].filter((right) => rights[right] === 1).length / 4) * 100
  )

  const pulseScore = Math.round((readinessScore + stats.activeRate + stats.catalogueCoverage + clamp(stats.salesPerCustomer * 38)) / 4)

  const pulseMetrics = [
    { label: 'Customers', value: stats.activeRate, detail: `${stats.activeCustomers}/${stats.totalCustomers} active`, x: 50, y: 10, tone: 'cyan' },
    { label: 'Sales Flow', value: clamp(stats.salesPerCustomer * 38), detail: `${stats.salesPerCustomer.toFixed(1)} per customer`, x: 84, y: 34, tone: 'blue' },
    { label: 'Catalogue', value: stats.catalogueCoverage, detail: `${stats.pricedProducts}/${stats.productCount} priced`, x: 74, y: 78, tone: 'violet' },
    { label: 'Data Health', value: clamp(100 - stats.unpricedProducts * 8 - stats.missingPayterm * 8), detail: `${stats.unpricedProducts + stats.missingPayterm} flags`, x: 26, y: 78, tone: 'green' },
    { label: 'Access', value: accessScore, detail: rights.ADM_USER === 1 ? 'privileged' : 'standard', x: 16, y: 34, tone: 'gold' },
  ]

  return (
    <>
      <style>{`
        @keyframes dashboardIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes cardFloatIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulseGlow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.18); }
        }

        .dashboard-page {
          --dash-bg-a: rgba(8, 18, 40, 0.84);
          --dash-bg-b: rgba(3, 9, 24, 0.9);
          --dash-border: rgba(126, 184, 255, 0.12);
          --dash-border-hot: rgba(126, 184, 255, 0.24);
          --dash-cyan: #38bdf8;
          --dash-blue: #2e86f5;
          --dash-green: #34d399;
          width: 100%;
          max-width: 1540px;
          height: calc(100vh - 48px);
          min-height: 720px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 330px;
          grid-template-rows: 104px 108px minmax(0, 1fr) 118px;
          gap: 12px;
          overflow: hidden;
          animation: dashboardIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .dash-card {
          position: relative;
          min-width: 0;
          min-height: 0;
          border: 1px solid var(--dash-border);
          background:
            linear-gradient(180deg, rgba(126, 184, 255, 0.035), transparent 48%),
            linear-gradient(145deg, var(--dash-bg-a), var(--dash-bg-b));
          border-radius: 18px;
          box-shadow: 0 18px 38px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.045);
          overflow: hidden;
          animation: cardFloatIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
          transition:
            transform 0.22s ease,
            border-color 0.22s ease,
            box-shadow 0.22s ease,
            background 0.22s ease;
        }

        .dash-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background:
            linear-gradient(90deg, rgba(56, 189, 248, 0.18), transparent 18%, transparent 82%, rgba(52, 211, 153, 0.1)),
            linear-gradient(180deg, rgba(255,255,255,0.05), transparent 34%);
          opacity: 0.45;
          transition: opacity 0.22s ease;
        }

        .dash-card:hover {
          transform: translateY(-2px);
          border-color: var(--dash-border-hot);
          box-shadow:
            0 22px 48px rgba(0, 0, 0, 0.34),
            0 0 0 1px rgba(56, 189, 248, 0.05),
            inset 0 1px 0 rgba(255,255,255,0.07);
        }

        .dash-card:hover::after {
          opacity: 0.85;
        }

        .stat-card:nth-child(1) { animation-delay: 0.04s; }
        .stat-card:nth-child(2) { animation-delay: 0.08s; }
        .stat-card:nth-child(3) { animation-delay: 0.12s; }
        .stat-card:nth-child(4) { animation-delay: 0.16s; }
        .matrix-card { animation-delay: 0.18s; }
        .side-card:nth-child(1) { animation-delay: 0.2s; }
        .side-card:nth-child(2) { animation-delay: 0.24s; }
        .side-card:nth-child(3) { animation-delay: 0.28s; }
        .bottom-card:nth-child(1) { animation-delay: 0.26s; }
        .bottom-card:nth-child(2) { animation-delay: 0.3s; }

        .stat-card:hover .stat-icon,
        .access-card:hover .access-icon {
          transform: translateY(-1px) scale(1.04);
        }

        .dash-hero {
          grid-column: 1 / 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 18px 20px;
        }

        .dash-kicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          width: fit-content;
          min-height: 28px;
          padding: 0 11px;
          border-radius: 999px;
          color: rgba(191, 219, 254, 0.96);
          background: rgba(46, 134, 245, 0.16);
          border: 1px solid rgba(126, 184, 255, 0.22);
          box-shadow: 0 0 18px rgba(46, 134, 245, 0.16);
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .dash-title {
          margin: 10px 0 4px;
          color: white;
          font-size: 24px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: 0;
        }

        .dash-copy {
          margin: 0;
          color: rgba(220, 225, 255, 0.52);
          font-size: 12.5px;
          line-height: 1.35;
        }

        .access-card {
          grid-column: 2 / 3;
          grid-row: 1 / 2;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background:
            radial-gradient(circle at 90% 20%, rgba(56, 189, 248, 0.18), transparent 42%),
            linear-gradient(180deg, rgba(126, 184, 255, 0.035), transparent 48%),
            linear-gradient(145deg, rgba(8, 18, 40, 0.88), rgba(3, 9, 24, 0.92));
        }

        .access-icon {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          color: rgba(126, 184, 255, 0.98);
          background: rgba(46, 134, 245, 0.14);
          border: 1px solid rgba(126, 184, 255, 0.2);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          flex-shrink: 0;
        }

        .label {
          display: block;
          color: rgba(220, 225, 255, 0.42);
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .access-value {
          display: block;
          margin-top: 4px;
          color: white;
          font-size: 17px;
          font-weight: 900;
        }

        .stat-grid {
          grid-column: 1 / 3;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .stat-card {
          padding: 15px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .stat-icon {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          color: rgba(126, 184, 255, 0.98);
          background: rgba(46, 134, 245, 0.13);
          border: 1px solid rgba(126, 184, 255, 0.16);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          flex-shrink: 0;
        }

        .stat-card.cyan .stat-icon { color: rgba(103, 232, 249, 0.95); background: rgba(6, 182, 212, 0.12); border-color: rgba(103, 232, 249, 0.16); }
        .stat-card.green .stat-icon { color: rgba(134, 239, 172, 0.95); background: rgba(34, 197, 94, 0.12); border-color: rgba(134, 239, 172, 0.16); }
        .stat-card.violet .stat-icon { color: rgba(196, 181, 253, 0.95); background: rgba(139, 92, 246, 0.13); border-color: rgba(196, 181, 253, 0.16); }

        .stat-value {
          color: white;
          font-size: 25px;
          font-weight: 900;
          line-height: 1;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }

        .stat-detail {
          margin-top: 5px;
          color: rgba(220, 225, 255, 0.46);
          font-size: 11.5px;
        }

        .matrix-card {
          grid-column: 1 / 2;
          grid-row: 3 / 4;
          padding: 16px;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr) auto;
          gap: 14px;
          position: relative;
          background:
            radial-gradient(circle at 48% 46%, rgba(103, 232, 249, 0.12), transparent 30%),
            radial-gradient(circle at 78% 18%, rgba(46, 134, 245, 0.14), transparent 34%),
            linear-gradient(180deg, rgba(126, 184, 255, 0.035), transparent 48%),
            linear-gradient(145deg, rgba(8, 18, 40, 0.88), rgba(3, 9, 24, 0.92));
        }

        .card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .card-title {
          margin: 0;
          color: white;
          font-size: 15px;
          font-weight: 900;
        }

        .card-hint {
          color: rgba(220, 225, 255, 0.38);
          font-size: 10.5px;
          font-weight: 750;
        }

        .pulse-shell {
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(300px, 0.92fr) minmax(260px, 1fr);
          align-items: center;
          gap: 18px;
        }

        .pulse-orbit {
          position: relative;
          min-height: 285px;
          height: 100%;
          border-radius: 20px;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 50%, rgba(12, 18, 35, 0.16) 0 28%, transparent 29%),
            linear-gradient(145deg, rgba(126, 184, 255, 0.045), rgba(255, 255, 255, 0.015));
          border: 1px solid rgba(126, 184, 255, 0.09);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .pulse-orbit::before,
        .pulse-orbit::after {
          content: '';
          position: absolute;
          inset: 28px;
          border-radius: 50%;
          border: 1px solid rgba(103, 232, 249, 0.14);
          box-shadow: 0 0 28px rgba(103, 232, 249, 0.08);
        }

        .pulse-orbit::after {
          inset: 66px;
          border-color: rgba(196, 181, 253, 0.16);
          box-shadow: 0 0 32px rgba(167, 139, 250, 0.1);
        }

        .pulse-core {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 142px;
          height: 142px;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 22%, rgba(255, 255, 255, 0.16), transparent 24%),
            conic-gradient(from 210deg, rgba(103, 232, 249, 0.92), rgba(167, 139, 250, 0.96), rgba(52, 211, 153, 0.78), rgba(103, 232, 249, 0.92));
          box-shadow:
            0 0 48px rgba(103, 232, 249, 0.18),
            0 0 70px rgba(167, 139, 250, 0.12);
        }

        .pulse-core::after {
          content: '';
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          background: linear-gradient(145deg, rgba(10, 17, 34, 0.96), rgba(18, 18, 32, 0.96));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .pulse-score,
        .pulse-score-label {
          position: relative;
          z-index: 1;
        }

        .pulse-score {
          color: white;
          font-size: 38px;
          line-height: 1;
          font-weight: 950;
          font-variant-numeric: tabular-nums;
        }

        .pulse-score-label {
          margin-top: 6px;
          color: rgba(220, 225, 255, 0.5);
          font-size: 9.5px;
          font-weight: 850;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .pulse-node {
          position: absolute;
          left: var(--x);
          top: var(--y);
          width: 44px;
          height: 44px;
          transform: translate(-50%, -50%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: rgba(8, 14, 30, 0.86);
          border: 1px solid rgba(126, 184, 255, 0.12);
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.26), 0 0 26px var(--glow);
          animation: pulseGlow 2.9s ease-in-out infinite;
        }

        .pulse-node::before {
          content: '';
          width: calc(10px + (var(--value) * 0.16px));
          height: calc(10px + (var(--value) * 0.16px));
          max-width: 26px;
          max-height: 26px;
          border-radius: 50%;
          background: var(--tone);
          box-shadow: 0 0 18px var(--glow);
        }

        .pulse-bars {
          display: grid;
          gap: 10px;
          align-content: center;
        }

        .pulse-bar {
          display: grid;
          grid-template-columns: 86px minmax(0, 1fr) 40px;
          align-items: center;
          gap: 10px;
          min-height: 42px;
          padding: 8px 10px;
          border-radius: 13px;
          background: rgba(126, 184, 255, 0.045);
          border: 1px solid rgba(126, 184, 255, 0.08);
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .pulse-bar:hover,
        .health-row:hover,
        .signal-row:hover,
        .access-row:hover,
        .op-card:hover {
          transform: translateX(2px);
          border-color: rgba(126, 184, 255, 0.18);
          background: rgba(126, 184, 255, 0.07);
        }

        .pulse-name {
          min-width: 0;
          color: rgba(235, 240, 255, 0.84);
          font-size: 11.5px;
          font-weight: 850;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pulse-detail {
          display: block;
          margin-top: 3px;
          color: rgba(220, 225, 255, 0.38);
          font-size: 9.5px;
          font-weight: 750;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pulse-track {
          height: 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        .pulse-fill {
          height: 100%;
          width: var(--value);
          border-radius: inherit;
          background: linear-gradient(90deg, var(--tone), rgba(255, 255, 255, 0.78));
          box-shadow: 0 0 16px var(--glow);
        }

        .pulse-value {
          color: white;
          font-size: 12px;
          font-weight: 950;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .pulse-footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: rgba(220, 225, 255, 0.46);
          font-size: 10.5px;
          font-weight: 800;
        }

        .pulse-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 26px;
          padding: 0 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(126, 184, 255, 0.09);
          white-space: nowrap;
        }

        .pulse-chip::before {
          content: '';
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #67e8f9;
          box-shadow: 0 0 12px rgba(103, 232, 249, 0.8);
        }

        .matrix-legend {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(220, 225, 255, 0.58);
          font-size: 11px;
          font-weight: 700;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(168, 85, 247, 0.45);
        }

        .legend-dot.hot { background: #a78bfa; }
        .legend-dot.best { background: #c4b5fd; }

        .matrix {
          min-height: 0;
          display: grid;
          grid-template-columns: 44px repeat(12, minmax(18px, 1fr));
          gap: 7px;
          align-content: center;
        }

        .matrix-label {
          display: flex;
          align-items: center;
          color: rgba(220, 225, 255, 0.7);
          font-size: 10.5px;
          font-weight: 850;
          letter-spacing: 0.08em;
        }

        .matrix-cell {
          aspect-ratio: 1 / 1;
          border-radius: 7px;
          background:
            linear-gradient(135deg, rgba(116, 89, 214, var(--alpha)), rgba(192, 132, 252, calc(var(--alpha) + 0.08))),
            rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(216, 180, 254, calc(var(--alpha) * 0.45));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        }

        .matrix-days {
          grid-column: 2 / -1;
          display: grid;
          grid-template-columns: repeat(12, minmax(18px, 1fr));
          gap: 7px;
        }

        .matrix-day {
          color: rgba(220, 225, 255, 0.66);
          font-size: 10px;
          font-weight: 850;
          text-align: center;
        }

        .side-stack {
          grid-column: 2 / 3;
          grid-row: 3 / 5;
          display: grid;
          grid-template-rows: 1fr 1fr 1fr;
          gap: 12px;
          min-height: 0;
        }

        .side-card {
          padding: 14px;
          min-height: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 10px;
        }

        .health-list,
        .signal-list,
        .access-list {
          display: grid;
          gap: 8px;
          min-height: 0;
          height: 100%;
        }

        .health-list,
        .signal-list {
          grid-template-rows: repeat(3, minmax(0, 1fr));
        }

        .access-list {
          grid-template-rows: repeat(4, minmax(0, 1fr));
        }

        .health-row {
          display: grid;
          grid-template-columns: 28px minmax(0, 1fr) 40px;
          align-items: center;
          gap: 8px;
          min-height: 0;
          padding: 0 10px;
          border-radius: 12px;
          background: rgba(126, 184, 255, 0.04);
          border: 1px solid rgba(126, 184, 255, 0.07);
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .health-icon {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          color: rgba(126, 184, 255, 0.95);
          background: rgba(46, 134, 245, 0.12);
        }

        .health-name,
        .signal-name,
        .access-name {
          color: rgba(225, 230, 255, 0.72);
          font-size: 11.5px;
          font-weight: 800;
        }

        .track {
          height: 6px;
          margin-top: 5px;
          border-radius: 999px;
          background: rgba(126, 184, 255, 0.1);
          overflow: hidden;
        }

        .fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2e86f5, #38bdf8, #34d399);
        }

        .health-value,
        .signal-value,
        .access-value-small {
          color: white;
          font-size: 12px;
          font-weight: 900;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .signal-row,
        .access-row {
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          padding: 0 10px;
          border-radius: 10px;
          background: rgba(126, 184, 255, 0.045);
          border: 1px solid rgba(126, 184, 255, 0.08);
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .bottom-grid {
          grid-column: 1 / 2;
          grid-row: 4 / 5;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 12px;
          min-height: 0;
        }

        .bottom-card {
          padding: 14px;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 10px;
        }

        .terms {
          display: grid;
          gap: 8px;
          align-content: center;
        }

        .term-row {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr) 34px;
          align-items: center;
          gap: 10px;
        }

        .term-label {
          color: rgba(225, 230, 255, 0.68);
          font-size: 11px;
          font-weight: 850;
        }

        .term-value {
          color: white;
          font-size: 11px;
          font-weight: 900;
          text-align: right;
        }

        .ops-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          align-items: stretch;
        }

        .op-card {
          min-width: 0;
          padding: 10px;
          border-radius: 12px;
          background: rgba(126, 184, 255, 0.045);
          border: 1px solid rgba(126, 184, 255, 0.08);
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .op-value {
          color: white;
          font-size: 20px;
          font-weight: 900;
          line-height: 1;
          white-space: nowrap;
        }

        .op-label {
          margin-top: 5px;
          color: rgba(220, 225, 255, 0.5);
          font-size: 10px;
          font-weight: 800;
          line-height: 1.2;
        }

        .dashboard-state {
          grid-column: 1 / -1;
          grid-row: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(220, 225, 255, 0.5);
          font-size: 13px;
          text-align: center;
        }

        @media (max-width: 1180px) {
          .dashboard-page {
            height: auto;
            min-height: 0;
            overflow: visible;
            display: flex;
            flex-direction: column;
          }

          .stat-grid,
          .bottom-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .side-stack {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            grid-template-rows: auto;
          }
        }

        @media (max-width: 720px) {
          .dash-hero,
          .stat-grid,
          .bottom-grid,
          .ops-grid,
          .side-stack {
            grid-template-columns: 1fr;
          }

          .dash-title {
            font-size: 21px;
          }

          .matrix {
            grid-template-columns: 38px repeat(12, minmax(14px, 1fr));
            gap: 5px;
          }
        }
      `}</style>

      <div className="dashboard-page">
        {loading ? (
          <div className="dashboard-state dash-card">
            <div>
              <Loader2 className="animate-spin mb-3 mx-auto text-purple-300" size={30} />
              <p>Loading dashboard statistics...</p>
            </div>
          </div>
        ) : error ? (
          <div className="dashboard-state dash-card">{error}</div>
        ) : (
          <>
            <section className="dash-hero dash-card">
              <div>
                <div className="dash-kicker"><Sparkles size={13} /> HopeCMS control room</div>
                <h1 className="dash-title">Customer Management Statistics</h1>
                <p className="dash-copy">A one-screen operating view for customers, sales, product pricing, data quality, and access posture.</p>
              </div>
            </section>

            <section className="access-card dash-card">
              <span className="access-icon"><ShieldCheck size={20} /></span>
              <div>
                <span className="label">Current Access</span>
                <span className="access-value">{user?.user_type || 'USER'}</span>
              </div>
            </section>

            <section className="stat-grid">
              {statCards.map((card) => {
                const Icon = card.icon
                return (
                  <article className={`stat-card dash-card ${card.tone}`} key={card.label}>
                    <div className="stat-top">
                      <span className="label">{card.label}</span>
                      <span className="stat-icon"><Icon size={17} /></span>
                    </div>
                    <div>
                      <div className="stat-value">{card.value}</div>
                      <div className="stat-detail">{card.detail}</div>
                    </div>
                  </article>
                )
              })}
            </section>

            <section className="matrix-card dash-card">
              <div className="card-head">
                <h2 className="card-title">Operational Pulse</h2>
                <span className="card-hint">live system signal</span>
              </div>

              <div className="pulse-shell">
                <div className="pulse-orbit" aria-label={`Operational pulse score ${pulseScore} percent`}>
                  <div className="pulse-core">
                    <span className="pulse-score">{pulseScore}</span>
                    <span className="pulse-score-label">Pulse</span>
                  </div>
                  {pulseMetrics.map((metric) => {
                    const toneMap = {
                      cyan: ['#67e8f9', 'rgba(103, 232, 249, 0.62)'],
                      blue: ['#60a5fa', 'rgba(96, 165, 250, 0.58)'],
                      violet: ['#c4b5fd', 'rgba(196, 181, 253, 0.6)'],
                      green: ['#86efac', 'rgba(134, 239, 172, 0.52)'],
                      gold: ['#fcd34d', 'rgba(252, 211, 77, 0.52)'],
                    }
                    const [tone, glow] = toneMap[metric.tone] || toneMap.cyan

                    return (
                      <span
                        className="pulse-node"
                        key={metric.label}
                        title={`${metric.label}: ${Math.round(metric.value)}%`}
                        style={{
                          '--x': `${metric.x}%`,
                          '--y': `${metric.y}%`,
                          '--value': metric.value,
                          '--tone': tone,
                          '--glow': glow,
                        }}
                      />
                    )
                  })}
                </div>

                <div className="pulse-bars">
                  {pulseMetrics.map((metric) => {
                    const toneMap = {
                      cyan: ['#67e8f9', 'rgba(103, 232, 249, 0.58)'],
                      blue: ['#60a5fa', 'rgba(96, 165, 250, 0.54)'],
                      violet: ['#c4b5fd', 'rgba(196, 181, 253, 0.58)'],
                      green: ['#86efac', 'rgba(134, 239, 172, 0.5)'],
                      gold: ['#fcd34d', 'rgba(252, 211, 77, 0.5)'],
                    }
                    const [tone, glow] = toneMap[metric.tone] || toneMap.cyan

                    return (
                      <div className="pulse-bar" key={metric.label}>
                        <div className="pulse-name">
                          {metric.label}
                          <span className="pulse-detail">{metric.detail}</span>
                        </div>
                        <div className="pulse-track">
                          <div
                            className="pulse-fill"
                            style={{
                              '--value': `${metric.value}%`,
                              '--tone': tone,
                              '--glow': glow,
                            }}
                          />
                        </div>
                        <span className="pulse-value">{Math.round(metric.value)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pulse-footer">
                <span className="pulse-chip">{stats.totalCustomers} customers monitored</span>
                <span className="pulse-chip">{stats.salesCount} sales signals</span>
              </div>
            </section>

            <aside className="side-stack">
              <section className="side-card dash-card">
                <div className="card-head">
                  <h2 className="card-title">System Health</h2>
                  <span className="card-hint">coverage</span>
                </div>
                <div className="health-list">
                  {healthItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <div className="health-row" key={item.label}>
                        <span className="health-icon"><Icon size={14} /></span>
                        <div>
                          <span className="health-name">{item.label}</span>
                          <div className="track"><div className="fill" style={{ width: `${item.value}%` }} /></div>
                        </div>
                        <span className="health-value">{item.value}%</span>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="side-card dash-card">
                <div className="card-head">
                  <h2 className="card-title">Executive Signals</h2>
                  <span className="card-hint">readiness</span>
                </div>
                <div className="signal-list">
                  {signalRows.map((signal) => (
                    <div className="signal-row" key={signal.label}>
                      <div>
                        <span className="signal-name">{signal.label}</span>
                        <div className="track"><div className="fill" style={{ width: `${signal.width}%` }} /></div>
                      </div>
                      <span className="signal-value">{signal.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="side-card dash-card">
                <div className="card-head">
                  <h2 className="card-title">Access Rules</h2>
                  <span className="card-hint">current</span>
                </div>
                <div className="access-list">
                  {accessRows.map((item) => (
                    <div className="access-row" key={item.label}>
                      <span className="access-name">{item.label}</span>
                      <span className="access-value-small">{item.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            </aside>

            <section className="bottom-grid">
              <article className="bottom-card dash-card">
                <div className="card-head">
                  <h2 className="card-title">Payment Terms</h2>
                  <span className="card-hint">customer split</span>
                </div>
                <div className="terms">
                  {payterms.map((item) => (
                    <div className="term-row" key={item.label}>
                      <span className="term-label">{item.label}</span>
                      <div className="track"><div className="fill" style={{ width: `${item.percent}%` }} /></div>
                      <span className="term-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="bottom-card dash-card">
                <div className="card-head">
                  <h2 className="card-title">Quick Signals</h2>
                  <span className="card-hint">non-redundant</span>
                </div>
                <div className="ops-grid">
                  <div className="op-card">
                    <span className="op-value">{stats.salesPerCustomer.toFixed(1)}</span>
                    <span className="op-label">sales per customer</span>
                  </div>
                  <div className="op-card">
                    <span className="op-value">{stats.unpricedProducts}</span>
                    <span className="op-label">unpriced products</span>
                  </div>
                  <div className="op-card">
                    <span className="op-value">{currency.format(Math.max(0, stats.highestPrice - stats.lowestPrice))}</span>
                    <span className="op-label">price spread</span>
                  </div>
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </>
  )
}

export default Dashboard
