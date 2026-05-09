import { useEffect, useMemo, useState } from 'react'
import { Loader2, Search, ShoppingCart } from 'lucide-react'
import { getSales } from '../../services/salesProductApi'

export default function SalesList() {
  const [sales, setSales] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSales = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await getSales()
        setSales(data || [])
      } catch (err) {
        setError(err.message || 'Unable to load sales records.')
      } finally {
        setLoading(false)
      }
    }

    loadSales()
  }, [])

  const filteredSales = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return sales

    return sales.filter((sale) =>
      sale.transno?.toLowerCase().includes(term) ||
      sale.custno?.toLowerCase().includes(term) ||
      sale.customer?.custname?.toLowerCase().includes(term)
    )
  }, [sales, search])

  return (
    <>
      <style>{`
        @keyframes salesPageIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes salesCardIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .sales-page {
          animation: salesPageIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .sales-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .sales-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sales-title-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #67e8f9;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(103, 232, 249, 0.14);
        }

        .sales-title {
          font-size: 20px;
          font-weight: 800;
          color: white;
          margin: 0;
          line-height: 1;
        }

        .sales-subtitle {
          font-size: 12px;
          color: rgba(180, 210, 255, 0.35);
          margin: 6px 0 0;
        }

        .sales-search {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 260px;
          background: rgba(126, 184, 255, 0.04);
          border: 1px solid rgba(126, 184, 255, 0.12);
          border-radius: 10px;
          padding: 8px 12px;
          transition: all 0.2s ease;
        }

        .sales-search:focus-within {
          border-color: rgba(56, 189, 248, 0.34);
          background: rgba(126, 184, 255, 0.07);
          box-shadow: 0 0 0 3px rgba(46, 134, 245, 0.1);
        }

        .sales-search input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: rgba(220, 235, 255, 0.86);
          font-size: 12.5px;
        }

        .sales-card {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          border-radius: 16px;
          border: 1px solid rgba(126, 184, 255, 0.12);
          background: linear-gradient(180deg, rgba(126, 184, 255, 0.035), transparent 44%), linear-gradient(145deg, rgba(8, 18, 40, 0.84), rgba(3, 9, 24, 0.9));
          box-shadow: 0 18px 38px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.045);
          overflow: hidden;
          animation: salesCardIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }

        .sales-card:hover {
          transform: translateY(-2px);
          border-color: rgba(126, 184, 255, 0.24);
          box-shadow: 0 22px 48px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255,255,255,0.07);
        }

        .sales-table-scroll {
          flex: 1;
          min-height: 0;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(126, 184, 255, 0.45) rgba(8, 18, 40, 0.28);
        }

        .sales-table-scroll::-webkit-scrollbar {
          width: 11px;
          height: 11px;
        }

        .sales-table-scroll::-webkit-scrollbar-track {
          background: rgba(5, 16, 48, 0.6);
        }

        .sales-table-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(46, 134, 245, 0.82), rgba(26, 79, 214, 0.88));
          border-radius: 999px;
          border: 2px solid rgba(5, 16, 48, 0.78);
        }

        .sales-table-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(96, 165, 250, 0.92), rgba(46, 134, 245, 0.92));
        }

        .sales-table-scroll::-webkit-scrollbar-corner {
          background: rgba(5, 16, 48, 0.6);
        }

        .sales-table {
          width: 100%;
          min-width: 760px;
          height: 100%;
          border-collapse: collapse;
          display: flex;
          flex-direction: column;
        }

        .sales-table thead {
          flex: 0 0 auto;
          display: table;
          width: 100%;
          table-layout: fixed;
        }

        .sales-table tbody {
          flex: 1;
          min-height: 0;
          display: block;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(126, 184, 255, 0.45) rgba(8, 18, 40, 0.28);
        }

        .sales-table tbody::-webkit-scrollbar {
          width: 11px;
        }

        .sales-table tbody::-webkit-scrollbar-track {
          background: rgba(5, 16, 48, 0.6);
        }

        .sales-table tbody::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(46, 134, 245, 0.82), rgba(26, 79, 214, 0.88));
          border-radius: 999px;
          border: 2px solid rgba(5, 16, 48, 0.78);
        }

        .sales-table tbody::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(96, 165, 250, 0.92), rgba(46, 134, 245, 0.92));
        }

        .sales-table tbody tr {
          display: table;
          width: 100%;
          table-layout: fixed;
        }

        .sales-table th,
        .sales-table td {
          padding: 13px 16px;
          border-bottom: 1px solid rgba(100, 160, 255, 0.06);
          text-align: left;
          white-space: nowrap;
        }

        .sales-table th {
          position: relative;
          z-index: 1;
          color: rgba(180, 210, 255, 0.35);
          background: rgba(6, 16, 36, 0.96);
          backdrop-filter: blur(12px);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          box-shadow: 0 1px 0 rgba(100, 160, 255, 0.1), 0 10px 18px rgba(2, 8, 24, 0.18);
        }

        .sales-table td {
          color: rgba(180, 210, 255, 0.68);
          font-size: 12.5px;
        }

        .sales-table tbody tr {
          transition: background 0.18s ease, box-shadow 0.18s ease;
        }

        .sales-table tbody tr:hover {
          background: rgba(126, 184, 255, 0.07);
          box-shadow: inset 3px 0 0 rgba(56, 189, 248, 0.75);
        }

        .sales-code {
          font-family: monospace;
          color: rgba(220, 235, 255, 0.9) !important;
          font-weight: 800;
        }

        .sales-customer {
          color: rgba(235, 245, 255, 0.9) !important;
          font-weight: 700;
        }

        .sales-empty,
        .sales-error {
          padding: 48px 16px;
          text-align: center;
          color: rgba(180, 210, 255, 0.28);
          font-size: 13px;
        }

        .sales-error {
          color: rgba(252, 165, 165, 0.95);
        }

        @media (max-width: 780px) {
          .sales-search { min-width: 100%; }
        }
      `}</style>

      <div className="sales-page">
        <div className="sales-header">
          <div className="sales-title-wrap">
            <div className="sales-title-icon"><ShoppingCart size={20} /></div>
            <div>
              <h1 className="sales-title">Sales</h1>
              <p className="sales-subtitle">Read-only transaction records</p>
            </div>
          </div>

          <div className="sales-search">
            <Search size={14} style={{ color: 'rgba(180, 210, 255, 0.28)' }} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sales..." />
          </div>
        </div>

        <section className="sales-card">
          {loading ? (
            <div className="sales-empty">
              <Loader2 className="animate-spin mb-3 mx-auto text-blue-400" size={30} />
              <p>Loading sales records...</p>
            </div>
          ) : error ? (
            <div className="sales-error">{error}</div>
          ) : filteredSales.length === 0 ? (
            <div className="sales-empty">No sales records found</div>
          ) : (
            <div className="sales-table-scroll">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>Trans No.</th>
                    <th>Sales Date</th>
                    <th>Cust No.</th>
                    <th>Customer</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.transno}>
                      <td className="sales-code">{sale.transno}</td>
                      <td>{sale.salesdate ? new Date(sale.salesdate).toLocaleDateString('en-PH', { dateStyle: 'medium' }) : '-'}</td>
                      <td>{sale.custno}</td>
                      <td className="sales-customer">{sale.customer?.custname || 'Unknown customer'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
