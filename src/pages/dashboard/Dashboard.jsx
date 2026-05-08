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

  const dashboardCharts = useMemo(() => {
    const paytermCounts = customers.reduce((counts, customer) => {
      const key = customer.payterm || 'N/A'
      counts[key] = (counts[key] || 0) + 1
      return counts
    }, {})

    const paytermChart = ['COD', '30D', '45D', 'N/A'].map((label) => ({
      label,
      value: paytermCounts[label] || 0,
      percent: customers.length ? Math.round(((paytermCounts[label] || 0) / customers.length) * 100) : 0,
    })).filter((item) => item.value > 0 || item.label !== 'N/A')

    const priceBands = [
      { label: 'Budget', hint: 'Under PHP 100', value: 0 },
      { label: 'Standard', hint: 'PHP 100-499', value: 0 },
      { label: 'Premium', hint: 'PHP 500+', value: 0 },
    ]

    products.forEach((product) => {
      const price = product.pricehist?.[0]?.unitprice || 0
      if (price < 100) priceBands[0].value += 1
      else if (price < 500) priceBands[1].value += 1
      else priceBands[2].value += 1
    })

    const pricedProducts = products.filter((product) => product.pricehist?.[0]?.unitprice).length
    const statusMix = [
      { label: 'Active', value: stats.activeCustomers, percent: stats.activeRate, tone: 'good' },
      {
        label: 'Inactive',
        value: stats.inactiveCustomers,
        percent: stats.totalCustomers ? Math.round((stats.inactiveCustomers / stats.totalCustomers) * 100) : 0,
        tone: 'warn',
      },
    ]

    const ops = [
      { label: 'Sales per customer', value: stats.totalCustomers ? (stats.salesCount / stats.totalCustomers).toFixed(1) : '0.0' },
      { label: 'Priced products', value: `${pricedProducts}/${stats.productCount}` },
      { label: 'Recovery queue', value: stats.inactiveCustomers },
    ]

    const insights = [
      {
        label: 'Customer base',
        value: stats.totalCustomers ? `${stats.activeRate}% active` : 'No records',
        detail: stats.inactiveCustomers ? `${stats.inactiveCustomers} queued for recovery` : 'No recovery backlog',
      },
      {
        label: 'Catalogue readiness',
        value: `${stats.catalogueCoverage}% priced`,
        detail: `${pricedProducts} of ${stats.productCount} products have a current price`,
      },
      {
        label: 'Sales footprint',
        value: `${stats.salesCount} transactions`,
        detail: stats.totalCustomers ? `${(stats.salesCount / stats.totalCustomers).toFixed(1)} sales per customer` : 'Waiting for customers',
      },
    ]

    const maxOperationalValue = Math.max(stats.totalCustomers, stats.productCount, stats.salesCount, 1)
    const operationalBars = [
      { label: 'Customers', value: stats.totalCustomers, percent: Math.round((stats.totalCustomers / maxOperationalValue) * 100), tone: 'blue' },
      { label: 'Sales', value: stats.salesCount, percent: Math.round((stats.salesCount / maxOperationalValue) * 100), tone: 'cyan' },
      { label: 'Products', value: stats.productCount, percent: Math.round((stats.productCount / maxOperationalValue) * 100), tone: 'violet' },
      { label: 'Inactive', value: stats.inactiveCustomers, percent: Math.round((stats.inactiveCustomers / maxOperationalValue) * 100), tone: 'red' },
    ]

    const moduleCoverage = [
      { label: 'Customer Module', value: stats.totalCustomers, caption: 'managed records', icon: 'C' },
      { label: 'Sales Module', value: stats.salesCount, caption: 'read-only transactions', icon: 'S' },
      { label: 'Product Module', value: stats.productCount, caption: 'catalogue rows', icon: 'P' },
      { label: 'Recovery Queue', value: stats.inactiveCustomers, caption: 'inactive customers', icon: 'R' },
    ]

    return { paytermChart, priceBands, statusMix, ops, insights, operationalBars, moduleCoverage }
  }, [customers, products, stats])

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

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dashboard-page {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: dashboardIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .dashboard-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 12px;
          align-items: start;
        }

        .dashboard-main,
        .dashboard-side {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .glass-panel {
          border: 1px solid rgba(150, 190, 255, 0.14);
          background: linear-gradient(145deg, rgba(12, 24, 44, 0.72), rgba(9, 18, 34, 0.52));
          box-shadow: 0 20px 44px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(22px) saturate(135%);
          -webkit-backdrop-filter: blur(22px) saturate(135%);
          border-radius: 18px;
          overflow: hidden;
          animation: cardIn 0.34s cubic-bezier(0.22, 1, 0.36, 1) both;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .glass-panel:hover,
        .stat-card:hover,
        .price-band:hover,
        .ops-item:hover,
        .insight-item:hover,
        .status-pill:hover {
          transform: translateY(-2px);
          border-color: rgba(126, 184, 255, 0.22);
          box-shadow: 0 18px 38px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .dashboard-hero {
          min-height: 142px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 176px;
          gap: 12px;
          padding: 12px;
        }

        .hero-copy {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }

        .hero-kicker {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          gap: 7px;
          padding: 6px 9px;
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
          margin: 12px 0 6px;
          color: rgba(246, 250, 255, 0.98);
          font-size: 25px;
          line-height: 1.05;
          font-weight: 850;
        }

        .hero-subtitle {
          max-width: 560px;
          margin: 0;
          color: rgba(203, 224, 255, 0.5);
          font-size: 12px;
          line-height: 1.45;
        }

        .hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .hero-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 29px;
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
          min-height: 114px;
          border-radius: 16px;
          border: 1px solid rgba(150, 190, 255, 0.13);
          background:
            linear-gradient(160deg, rgba(28, 49, 76, 0.78), rgba(10, 21, 37, 0.58)),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 32px);
          overflow: hidden;
        }

        .hero-meter {
          position: absolute;
          inset: 14px;
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
          font-size: 34px;
          line-height: 1;
          font-weight: 850;
          font-variant-numeric: tabular-nums;
        }

        .meter-track {
          height: 7px;
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
          grid-template-columns: 1.15fr 1fr 1fr 1.25fr;
          gap: 9px;
        }

        .stat-card {
          min-height: 86px;
          padding: 10px;
          border-radius: 16px;
          border: 1px solid rgba(150, 190, 255, 0.12);
          background: rgba(8, 18, 34, 0.58);
          backdrop-filter: blur(16px);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.22);
          animation: cardIn 0.34s cubic-bezier(0.22, 1, 0.36, 1) both;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .stat-card:nth-child(1) { animation-delay: 0.02s; }
        .stat-card:nth-child(2) { animation-delay: 0.06s; }
        .stat-card:nth-child(3) { animation-delay: 0.1s; }
        .stat-card:nth-child(4) { animation-delay: 0.14s; }

        .stat-card:hover {
          background: rgba(12, 28, 52, 0.7);
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
          width: 31px;
          height: 31px;
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
          margin-top: 9px;
          color: rgba(248, 252, 255, 0.98);
          font-size: 20px;
          line-height: 1;
          font-weight: 850;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .stat-detail {
          margin-top: 5px;
          color: rgba(203, 224, 255, 0.48);
          font-size: 11.5px;
        }

        .stat-card.violet .stat-icon { color: rgba(196, 181, 253, 0.95); background: rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.18); }
        .stat-card.cyan .stat-icon { color: rgba(103, 232, 249, 0.95); background: rgba(6, 182, 212, 0.1); border-color: rgba(6, 182, 212, 0.18); }
        .stat-card.green .stat-icon { color: rgba(134, 239, 172, 0.95); background: rgba(34, 197, 94, 0.1); border-color: rgba(34, 197, 94, 0.18); }

        .health-panel {
          padding: 12px;
        }

        .panel-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
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
          gap: 8px;
        }

        .health-row {
          display: grid;
          grid-template-columns: 28px minmax(0, 1fr) 42px;
          align-items: center;
          gap: 10px;
        }

        .health-icon {
          width: 28px;
          height: 28px;
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
          padding: 12px;
        }

        .main-lower-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
          gap: 10px;
          align-items: stretch;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 10px;
        }

        .analytics-panel {
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
        }

        .chart-stack {
          display: grid;
          gap: 7px;
        }

        .bar-row {
          display: grid;
          grid-template-columns: 48px minmax(0, 1fr) 38px;
          align-items: center;
          gap: 10px;
        }

        .bar-label {
          color: rgba(225, 239, 255, 0.78);
          font-size: 12px;
          font-weight: 800;
        }

        .bar-track {
          height: 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        .bar-fill {
          min-width: 4px;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #60a5fa, #22d3ee);
        }

        .bar-value {
          color: rgba(235, 245, 255, 0.9);
          font-size: 12px;
          font-weight: 850;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .donut-panel {
          display: grid;
          grid-template-columns: 92px minmax(0, 1fr);
          align-items: center;
          gap: 12px;
        }

        .donut {
          width: 92px;
          aspect-ratio: 1;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at center, rgba(8, 18, 34, 0.95) 0 54%, transparent 55%),
            conic-gradient(#34d399 0 calc(var(--active) * 1%), #f87171 0 100%);
          border: 1px solid rgba(150, 190, 255, 0.12);
          box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.28);
        }

        .donut strong {
          color: white;
          font-size: 19px;
          line-height: 1;
          font-weight: 900;
        }

        .donut span {
          display: block;
          margin-top: 4px;
          color: rgba(203, 224, 255, 0.42);
          font-size: 10px;
          font-weight: 800;
          text-align: center;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .status-list {
          display: grid;
          gap: 7px;
        }

        .status-pill {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 12px;
          background: rgba(100, 160, 255, 0.05);
          border: 1px solid rgba(150, 190, 255, 0.09);
        }

        .status-pill.good .status-dot { background: #34d399; }
        .status-pill.warn .status-dot { background: #f87171; }

        .status-left {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          box-shadow: 0 0 12px currentColor;
          flex-shrink: 0;
        }

        .status-name {
          color: rgba(225, 239, 255, 0.8);
          font-size: 12px;
          font-weight: 800;
        }

        .status-number {
          color: rgba(248, 252, 255, 0.94);
          font-size: 13px;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
        }

        .price-band-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          align-items: stretch;
        }

        .price-band {
          min-height: 82px;
          border-radius: 14px;
          border: 1px solid rgba(150, 190, 255, 0.1);
          background: linear-gradient(180deg, rgba(96, 165, 250, 0.11), rgba(8, 18, 34, 0.35));
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .price-band-label {
          color: rgba(225, 239, 255, 0.86);
          font-size: 12px;
          font-weight: 850;
        }

        .price-band-hint {
          display: block;
          margin-top: 5px;
          color: rgba(203, 224, 255, 0.36);
          font-size: 10.5px;
          line-height: 1.35;
        }

        .price-band-value {
          color: white;
          font-size: 22px;
          font-weight: 900;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .ops-card {
          display: grid;
          gap: 8px;
          align-content: stretch;
        }

        .ops-item {
          border-radius: 13px;
          border: 1px solid rgba(150, 190, 255, 0.09);
          background: rgba(100, 160, 255, 0.045);
          padding: 10px;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .ops-label {
          display: block;
          color: rgba(203, 224, 255, 0.38);
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .ops-value {
          display: block;
          margin-top: 7px;
          color: rgba(248, 252, 255, 0.95);
          font-size: 20px;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
        }

        .insight-list {
          display: grid;
          gap: 8px;
        }

        .main-insights {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .main-insights .insight-item {
          min-height: 86px;
        }

        .graph-panel {
          padding: 12px;
          min-height: 220px;
          display: flex;
          flex-direction: column;
        }

        .column-chart {
          flex: 1;
          min-height: 150px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: end;
          gap: 12px;
          padding: 10px 4px 0;
        }

        .chart-column {
          min-width: 0;
          display: grid;
          grid-template-rows: 1fr auto auto;
          align-items: end;
          gap: 7px;
          height: 100%;
        }

        .column-track {
          height: 126px;
          display: flex;
          align-items: flex-end;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025));
          border: 1px solid rgba(150, 190, 255, 0.08);
          overflow: hidden;
        }

        .column-fill {
          width: 100%;
          min-height: 8px;
          border-radius: 13px 13px 0 0;
          background: linear-gradient(180deg, #60a5fa, #2563eb);
          box-shadow: 0 -10px 22px rgba(96, 165, 250, 0.16);
          transition: height 0.28s ease, filter 0.18s ease;
        }

        .chart-column:hover .column-fill {
          filter: brightness(1.18);
        }

        .chart-column.cyan .column-fill { background: linear-gradient(180deg, #67e8f9, #0891b2); }
        .chart-column.violet .column-fill { background: linear-gradient(180deg, #c4b5fd, #7c3aed); }
        .chart-column.red .column-fill { background: linear-gradient(180deg, #fca5a5, #dc2626); }

        .column-value {
          color: rgba(248, 252, 255, 0.95);
          font-size: 15px;
          font-weight: 900;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }

        .column-label {
          color: rgba(203, 224, 255, 0.42);
          font-size: 10px;
          font-weight: 850;
          text-align: center;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .coverage-panel {
          padding: 12px;
          display: flex;
          flex-direction: column;
          min-height: 220px;
        }

        .coverage-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .coverage-card {
          border-radius: 14px;
          border: 1px solid rgba(150, 190, 255, 0.09);
          background: rgba(100, 160, 255, 0.045);
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 82px;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .coverage-card:hover {
          transform: translateY(-2px);
          border-color: rgba(126, 184, 255, 0.22);
          background: rgba(100, 160, 255, 0.075);
        }

        .coverage-top {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .coverage-icon {
          width: 26px;
          height: 26px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(96, 165, 250, 0.12);
          color: rgba(191, 219, 254, 0.96);
          font-size: 11px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .coverage-label {
          min-width: 0;
          color: rgba(225, 239, 255, 0.82);
          font-size: 11.5px;
          font-weight: 850;
          line-height: 1.15;
        }

        .coverage-value {
          margin-top: 8px;
          color: white;
          font-size: 22px;
          font-weight: 900;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .coverage-caption {
          margin-top: 4px;
          color: rgba(203, 224, 255, 0.38);
          font-size: 10.5px;
          line-height: 1.25;
        }

        .insight-item {
          padding: 10px;
          border-radius: 13px;
          border: 1px solid rgba(150, 190, 255, 0.09);
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.08), rgba(52, 211, 153, 0.04));
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .insight-label {
          display: block;
          color: rgba(203, 224, 255, 0.38);
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .insight-value {
          display: block;
          margin-top: 6px;
          color: rgba(248, 252, 255, 0.96);
          font-size: 15px;
          font-weight: 900;
        }

        .insight-detail {
          display: block;
          margin-top: 4px;
          color: rgba(203, 224, 255, 0.45);
          font-size: 11px;
          line-height: 1.35;
        }

        .role-card {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .role-icon {
          width: 38px;
          height: 38px;
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
          gap: 6px;
        }

        .mini-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 9px 0;
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
            align-items: start;
          }
        }

        @media (max-width: 920px) {
          .dashboard-hero,
          .stats-grid,
          .analytics-grid,
          .main-lower-grid,
          .main-insights,
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

          .price-band-grid {
            grid-template-columns: 1fr;
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

              <section className="main-insights">
                {dashboardCharts.insights.map((item) => (
                  <article className="insight-item glass-panel" key={item.label}>
                    <span className="insight-label">{item.label}</span>
                    <span className="insight-value">{item.value}</span>
                    <span className="insight-detail">{item.detail}</span>
                  </article>
                ))}
              </section>

              <section className="main-lower-grid">
                <article className="graph-panel glass-panel">
                  <div className="panel-title">
                    <h2>Operational Load</h2>
                    <span>relative volume</span>
                  </div>
                  <div className="column-chart">
                    {dashboardCharts.operationalBars.map((item) => (
                      <div className={`chart-column ${item.tone}`} key={item.label}>
                        <div className="column-track">
                          <div className="column-fill" style={{ height: `${item.percent}%` }} />
                        </div>
                        <span className="column-value">{item.value}</span>
                        <span className="column-label">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="coverage-panel glass-panel">
                  <div className="panel-title">
                    <h2>Module Coverage</h2>
                    <span>scope</span>
                  </div>
                  <div className="coverage-grid">
                    {dashboardCharts.moduleCoverage.map((item) => (
                      <div className="coverage-card" key={item.label}>
                        <div className="coverage-top">
                          <span className="coverage-icon">{item.icon}</span>
                          <span className="coverage-label">{item.label}</span>
                        </div>
                        <div>
                          <div className="coverage-value">{item.value}</div>
                          <div className="coverage-caption">{item.caption}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="analytics-grid">
                <article className="analytics-panel glass-panel">
                  <div className="panel-title">
                    <h2>Payment Terms</h2>
                    <span>customer split</span>
                  </div>
                  <div className="chart-stack">
                    {dashboardCharts.paytermChart.map((item) => (
                      <div className="bar-row" key={item.label}>
                        <span className="bar-label">{item.label}</span>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${item.percent}%` }} />
                        </div>
                        <span className="bar-value">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="analytics-panel glass-panel">
                  <div className="panel-title">
                    <h2>Status Mix</h2>
                    <span>active vs inactive</span>
                  </div>
                  <div className="donut-panel">
                    <div className="donut" style={{ '--active': stats.activeRate }}>
                      <div>
                        <strong>{stats.activeRate}%</strong>
                        <span>Active</span>
                      </div>
                    </div>
                    <div className="status-list">
                      {dashboardCharts.statusMix.map((item) => (
                        <div className={`status-pill ${item.tone}`} key={item.label}>
                          <span className="status-left">
                            <span className="status-dot" />
                            <span className="status-name">{item.label}</span>
                          </span>
                          <span className="status-number">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
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

              <section className="side-card glass-panel">
                <div className="panel-title">
                  <h2>Price Bands</h2>
                  <span>catalogue</span>
                </div>
                <div className="price-band-grid">
                  {dashboardCharts.priceBands.map((band) => (
                    <div className="price-band" key={band.label}>
                      <div>
                        <span className="price-band-label">{band.label}</span>
                        <span className="price-band-hint">{band.hint}</span>
                      </div>
                      <span className="price-band-value">{band.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="side-card glass-panel">
                <div className="panel-title">
                  <h2>Operations</h2>
                  <span>quick read</span>
                </div>
                <div className="ops-card">
                  {dashboardCharts.ops.map((item) => (
                    <div className="ops-item" key={item.label}>
                      <span className="ops-label">{item.label}</span>
                      <span className="ops-value">{item.value}</span>
                    </div>
                  ))}
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
