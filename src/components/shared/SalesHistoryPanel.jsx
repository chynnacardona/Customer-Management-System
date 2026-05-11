import { useState } from 'react'
import { ReceiptText } from 'lucide-react'
import SalesDetailModal from './SalesDetailModal'
import { getSalesDetail } from '../../services/salesProductApi'
import { useCurrencyFormatter } from '../../utils/currency'

function SalesHistoryPanel({ transactions }) {
  const { formatCurrency } = useCurrencyFormatter()
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [details, setDetails] = useState([]) 
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState('')

  const handleOpenDetail = async (transaction) => {
    setSelectedTransaction(transaction)
    setLoadingDetail(true)
    setDetails([])
    setDetailError('')
    
    try {
      const data = await getSalesDetail(transaction.transno || transaction.trans_no || transaction.transNo)
      setDetails(data)
    } catch (err) {
      setDetailError(err.message || 'Unable to load transaction items.')
    } finally {
      setLoadingDetail(false)
    }
  }
  return (
    <>
      <style>{`
        @keyframes salesHistoryIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .sales-history-panel { flex: 1; min-height: 260px; display: flex; flex-direction: column; background: linear-gradient(180deg, rgba(126, 184, 255, 0.035), transparent 44%), linear-gradient(145deg, rgba(8, 18, 40, 0.84), rgba(3, 9, 24, 0.9)); border: 1px solid rgba(126, 184, 255, 0.12); border-radius: 18px; overflow: hidden; box-shadow: 0 18px 38px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.045); animation: salesHistoryIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) both; transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease; }
        .sales-history-panel:hover { transform: translateY(-2px); border-color: rgba(126, 184, 255, 0.24); box-shadow: 0 22px 48px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255,255,255,0.07); }
        .sales-history-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid rgba(100, 160, 255, 0.08); }
        .sales-history-title-wrap { display: flex; align-items: center; gap: 10px; }
        .sales-history-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #7eb8ff; background: rgba(46, 134, 245, 0.12); border: 1px solid rgba(100, 160, 255, 0.14); }
        .sales-history-title { margin: 0; color: white; font-size: 15px; font-weight: 700; }
        .sales-history-subtitle { margin: 2px 0 0; color: rgba(180, 210, 255, 0.3); font-size: 11px; }
        .sales-history-scroll { flex: 1; min-height: 0; overflow: auto; }
        .sales-history-table { width: 100%; min-width: 760px; border-collapse: collapse; table-layout: fixed; }
        .sales-history-table th { padding: 12px 16px; color: rgba(180, 210, 255, 0.42); background: rgba(6, 16, 36, 0.96); text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap; }
        .sales-history-table td { padding: 13px 16px; color: rgba(180, 210, 255, 0.68); font-size: 12.5px; border-top: 1px solid rgba(100, 160, 255, 0.05); white-space: nowrap; }
        .sales-history-row { cursor: pointer; transition: background 0.18s ease, box-shadow 0.18s ease; }
        .sales-history-row:hover { background: rgba(126, 184, 255, 0.07); box-shadow: inset 3px 0 0 rgba(56, 189, 248, 0.75); }
        .sales-history-trans { font-family: monospace; color: rgba(220, 235, 255, 0.88) !important; font-weight: 700; }
        .sales-history-date { display: inline-flex; align-items: center; gap: 6px; }
        .sales-history-total { color: rgba(220, 235, 255, 0.86) !important; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }
        .sales-history-empty { padding: 38px 16px; color: rgba(180, 210, 255, 0.28); text-align: center; font-size: 13px; }
        @media (max-width: 760px) { .sales-history-table { min-width: 640px; } }
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
              <colgroup>
                <col style={{ width: '24%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '26%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Trans No.</th>
                  <th>Sales Date</th>
                  <th>Employee</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                 {transactions.map((ts) => {
                    const rowTotal = ts.salesdetail?.reduce((acc, item) => {
                      const p = item.product?.pricehist?.[0]?.unitprice || 0;
                      return acc + (Number(item.quantity) * p);
                    }, 0);

                    return (
                      <tr key={ts.transno} className="sales-history-row" onClick={() => handleOpenDetail(ts)}>
                        <td className="sales-history-trans">{ts.transno}</td>
                        <td>{new Date(ts.salesdate).toLocaleDateString()}</td>
                        <td>{ts.salesdetail?.length || 0} Items</td>
                        <td className="sales-history-total" style={{ fontWeight: 'bold', color: '#4ade80' }}>
                          {formatCurrency(rowTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
            </table>
          </div>
        )}
      </section>

      <SalesDetailModal 
        isOpen={Boolean(selectedTransaction)} 
        transaction={selectedTransaction} 
        details={details} 
        isLoading={loadingDetail}
        error={detailError}
        onClose={() => setSelectedTransaction(null)} 
      />
    </>
  )
}

export default SalesHistoryPanel
