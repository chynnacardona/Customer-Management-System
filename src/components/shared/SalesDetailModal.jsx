import { X, ReceiptText, Loader2 } from 'lucide-react'

// Added details and isLoading to the props
function SalesDetailModal({ isOpen, onClose, transaction, details, isLoading }) {
  if (!isOpen || !transaction) return null

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)

  // Use total_amount from the database, or fall back to calculation if data is weird
  const displayTotal = transaction.total_amount || transaction.total || 0;

  return (
    <>
      <style>{`
        @keyframes salesDetailIn { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .sales-detail-overlay { position: fixed; inset: 0; z-index: 120; display: flex; align-items: center; justify-content: center; background: rgba(1, 6, 18, 0.74); backdrop-filter: blur(6px); padding: 16px; }
        .sales-detail-card { width: 100%; max-width: 640px; background: rgba(8, 18, 40, 0.97); border: 1px solid rgba(100, 160, 255, 0.12); border-radius: 18px; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6); overflow: hidden; animation: salesDetailIn 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .sales-detail-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid rgba(100, 160, 255, 0.08); }
        .sales-detail-title-group { display: flex; align-items: center; gap: 10px; }
        .sales-detail-icon { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #7eb8ff; background: rgba(46, 134, 245, 0.12); border: 1px solid rgba(100, 160, 255, 0.14); }
        .sales-detail-title { margin: 0; color: white; font-size: 15px; font-weight: 700; }
        .sales-detail-subtitle { margin: 2px 0 0; color: rgba(180, 210, 255, 0.34); font-size: 11px; }
        .sales-detail-close { width: 30px; height: 30px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: rgba(180, 210, 255, 0.35); cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .sales-detail-close:hover { background: rgba(255, 70, 70, 0.08); border-color: rgba(255, 70, 70, 0.15); color: rgba(255, 100, 100, 0.85); }
        .sales-detail-body { padding: 18px 20px 20px; }
        .sales-detail-meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 16px; }
        .sales-detail-meta-item { background: rgba(100, 160, 255, 0.04); border: 1px solid rgba(100, 160, 255, 0.08); border-radius: 10px; padding: 10px 12px; }
        .sales-detail-label { display: block; color: rgba(180, 210, 255, 0.28); font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 5px; }
        .sales-detail-value { color: rgba(220, 235, 255, 0.88); font-size: 12.5px; font-weight: 600; }
        .sales-detail-table-wrap { border: 1px solid rgba(100, 160, 255, 0.08); border-radius: 12px; overflow: hidden; min-height: 100px; position: relative; }
        .sales-detail-table { width: 100%; border-collapse: collapse; }
        .sales-detail-table th { padding: 11px 12px; text-align: left; color: rgba(180, 210, 255, 0.35); background: rgba(100, 160, 255, 0.03); font-size: 9.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
        .sales-detail-table td { padding: 12px; color: rgba(180, 210, 255, 0.68); font-size: 12.5px; border-top: 1px solid rgba(100, 160, 255, 0.05); }
        .sales-detail-product { color: rgba(220, 235, 255, 0.9) !important; font-weight: 600; }
        .sales-detail-number { text-align: right; font-variant-numeric: tabular-nums; }
        .sales-detail-total { display: flex; justify-content: flex-end; align-items: center; gap: 14px; padding-top: 14px; color: rgba(180, 210, 255, 0.4); font-size: 12px; }
        .sales-detail-total strong { color: white; font-size: 16px; }
        .loading-overlay-modal { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; color: #7eb8ff; gap: 10px; }
        @media (max-width: 640px) { .sales-detail-meta { grid-template-columns: 1fr; } .sales-detail-table-wrap { overflow-x: auto; } .sales-detail-table { min-width: 540px; } }
      `}</style>

      <div className="sales-detail-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="sales-detail-card">
          <div className="sales-detail-header">
            <div className="sales-detail-title-group">
              <div className="sales-detail-icon"><ReceiptText size={17} /></div>
              <div>
                <h2 className="sales-detail-title">Sales Detail</h2>
                <p className="sales-detail-subtitle">#{transaction.trans_no || transaction.transNo}</p>
              </div>
            </div>
            <button className="sales-detail-close" onClick={onClose} title="Close"><X size={15} /></button>
          </div>

          <div className="sales-detail-body">
            <div className="sales-detail-meta">
              <div className="sales-detail-meta-item">
                <span className="sales-detail-label">Transaction</span>
                <span className="sales-detail-value">{transaction.trans_no || transaction.transNo}</span>
              </div>
              <div className="sales-detail-meta-item">
                <span className="sales-detail-label">Sales Date</span>
                <span className="sales-detail-value">
                  {new Date(transaction.sales_date || transaction.salesDate).toLocaleDateString()}
                </span>
              </div>
              <div className="sales-detail-meta-item">
                <span className="sales-detail-label">Employee ID</span>
                <span className="sales-detail-value">{transaction.emp_no || transaction.empNo}</span>
              </div>
            </div>

            <div className="sales-detail-table-wrap">
              {isLoading ? (
                <div className="loading-overlay-modal">
                  <Loader2 className="animate-spin" size={24} />
                  <span>Loading items...</span>
                </div>
              ) : (
                <table className="sales-detail-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details && details.length > 0 ? (
                      details.map((item, idx) => (
                        <tr key={idx}>
                          {/* REACH INTO THE JOINED PRODUCT OBJECT */}
                          <td className="sales-detail-product">
                            {item.product?.description || item.prodCode}
                          </td>
                          <td className="sales-detail-number" style={{ textAlign: 'center' }}>
                            {item.quantity}
                          </td>
                          <td className="sales-detail-number" style={{ textAlign: 'left' }}>
                            {item.product?.unit || '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '20px' }}>
                          No line items found for this transaction.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="sales-detail-total">
              Transaction Total <strong>{formatCurrency(displayTotal)}</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SalesDetailModal