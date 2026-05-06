import { useState } from 'react'
import { CalendarDays, ChevronRight, ReceiptText, Loader2 } from 'lucide-react'
import SalesDetailModal from './SalesDetailModal'
import { getSalesDetail } from '../../services/salesProductApi' // 1. Import the API

function SalesHistoryPanel({ transactions }) {
  // 2. Added these states to hold the "Actual" info from the DB
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [details, setDetails] = useState([]) 
  const [loadingDetail, setLoadingDetail] = useState(false)

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)

  // 3. Updated Logic to fetch from database when a row is clicked
  const handleOpenDetail = async (transaction) => {
    setSelectedTransaction(transaction) // Open the modal immediately
    setLoadingDetail(true)
    setDetails([]) // Clear old items
    
    try {
      // transaction.trans_no comes from your Supabase 'sales' table
      const data = await getSalesDetail(transaction.trans_no || transaction.transNo)
      setDetails(data) // Now 'details' contains real product descriptions!
    } catch (err) {
      console.error("Error fetching line items:", err.message)
    } finally {
      setLoadingDetail(false)
    }
  }
  return (
    <>
      <style>{`
        .sales-history-panel { background: rgba(8, 18, 40, 0.62); border: 1px solid rgba(100, 160, 255, 0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
        .sales-history-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid rgba(100, 160, 255, 0.08); }
        .sales-history-title-wrap { display: flex; align-items: center; gap: 10px; }
        .sales-history-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #7eb8ff; background: rgba(46, 134, 245, 0.12); border: 1px solid rgba(100, 160, 255, 0.14); }
        .sales-history-title { margin: 0; color: white; font-size: 15px; font-weight: 700; }
        .sales-history-subtitle { margin: 2px 0 0; color: rgba(180, 210, 255, 0.3); font-size: 11px; }
        .sales-history-table { width: 100%; border-collapse: collapse; }
        .sales-history-table th { padding: 12px 16px; color: rgba(180, 210, 255, 0.35); background: rgba(100, 160, 255, 0.03); text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap; }
        .sales-history-table td { padding: 13px 16px; color: rgba(180, 210, 255, 0.68); font-size: 12.5px; border-top: 1px solid rgba(100, 160, 255, 0.05); white-space: nowrap; }
        .sales-history-row { cursor: pointer; transition: background 0.15s ease; }
        .sales-history-row:hover { background: rgba(100, 160, 255, 0.06); }
        .sales-history-trans { font-family: monospace; color: rgba(220, 235, 255, 0.88) !important; font-weight: 700; }
        .sales-history-date { display: inline-flex; align-items: center; gap: 6px; }
        .sales-history-total { color: rgba(220, 235, 255, 0.86) !important; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }
        .sales-history-open { width: 28px; text-align: right; color: rgba(180, 210, 255, 0.28) !important; }
        .sales-history-empty { padding: 38px 16px; color: rgba(180, 210, 255, 0.28); text-align: center; font-size: 13px; }
        @media (max-width: 760px) { .sales-history-scroll { overflow-x: auto; } .sales-history-table { min-width: 640px; } }
      `}</style>

      <section className="sales-history-panel">
        <div className="sales-history-header">
          <div className="sales-history-title-wrap">
            <div className="sales-history-icon"><ReceiptText size={16} /></div>
            <div>
              <h2 className="sales-history-title">Sales History</h2>
              <p className="sales-history-subtitle">{transactions.length} records</p>
            </div>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="sales-history-empty">No sales recorded</div>
        ) : (
          <div className="sales-history-scroll">
            <table className="sales-history-table">
              <thead>
                <tr>
                  <th>Trans No.</th>
                  <th>Sales Date</th>
                  <th>Employee</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th aria-label="Open detail" />
                </tr>
              </thead>
              <tbody>
                  {transactions.map((ts, index) => (
                    <tr 
                      key={ts.transno || ts.trans_no || index} 
                      className="sales-history-row" 
                      onClick={() => handleOpenDetail(ts)}
                    >
                      <td className="sales-history-trans">{ts.transno || ts.trans_no}</td>
                      <td>
                        <span className="sales-history-date">
                          <CalendarDays size={12} />
                          {/* Use lowercase salesdate */}
                          {new Date(ts.salesdate || ts.sales_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td>{ts.empno || ts.emp_no}</td>
                      <td className="sales-history-total">
                        {formatCurrency(ts.totalamount || ts.total_amount || 0)}
                      </td>
                      <td className="sales-history-open"><ChevronRight size={14} /></td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 6. Pass the live 'details' and 'loading' status to the Modal */}
      <SalesDetailModal 
        isOpen={Boolean(selectedTransaction)} 
        transaction={selectedTransaction} 
        details={details} 
        isLoading={loadingDetail}
        onClose={() => setSelectedTransaction(null)} 
      />
    </>
  )
}

export default SalesHistoryPanel