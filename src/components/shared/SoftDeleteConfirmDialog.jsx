import { X, Trash2, AlertTriangle } from 'lucide-react'

// para kay M1: i-replace yung onConfirm handler ng actual na softDeleteCustomer() API call
function SoftDeleteConfirmDialog({ isOpen, onClose, onConfirm, customer }) {
  if (!isOpen) return null

  const handleConfirm = () => {
    // para kay M1: ilagay dito yung softDeleteCustomer(customer.custno) API call
    console.log('Soft Delete Customer:', customer?.custno)
    onConfirm?.()
    onClose()
  }

  return (
    <>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .dialog-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(1, 6, 18, 0.75);
          backdrop-filter: blur(6px);
          padding: 16px;
        }

        .dialog-card {
          width: 100%;
          max-width: 380px;
          background: rgba(8, 18, 40, 0.97);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 20px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(239, 68, 68, 0.05);
          animation: modalIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          overflow: hidden;
        }

        .dialog-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid rgba(239, 68, 68, 0.08);
        }

        .dialog-title {
          font-size: 15px;
          font-weight: 700;
          color: white;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .warning-icon {
          color: rgba(248, 113, 113, 0.8);
        }

        .dialog-close {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(180, 210, 255, 0.3);
          transition: all 0.2s ease;
        }

        .dialog-close:hover {
          background: rgba(255, 70, 70, 0.08);
          border-color: rgba(255, 70, 70, 0.15);
          color: rgba(255, 100, 100, 0.8);
        }

        .dialog-body {
          padding: 20px;
        }

        .dialog-message {
          font-size: 13px;
          color: rgba(180, 210, 255, 0.55);
          line-height: 1.6;
          margin: 0 0 12px;
        }

        .customer-highlight {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.15);
          border-radius: 8px;
          padding: 8px 12px;
          width: 100%;
          box-sizing: border-box;
        }

        .customer-highlight .custno {
          font-size: 11px;
          font-family: monospace;
          color: rgba(248, 113, 113, 0.6);
        }

        .customer-highlight .custname {
          font-size: 13px;
          font-weight: 600;
          color: rgba(220, 235, 255, 0.85);
        }

        .dialog-note {
          font-size: 11px;
          color: rgba(180, 210, 255, 0.3);
          margin: 10px 0 0;
          font-style: italic;
        }

        .dialog-footer {
          padding: 14px 20px;
          border-top: 1px solid rgba(239, 68, 68, 0.08);
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .btn-cancel {
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid rgba(100, 160, 255, 0.12);
          background: transparent;
          color: rgba(180, 210, 255, 0.5);
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cancel:hover {
          background: rgba(100, 160, 255, 0.06);
          color: rgba(180, 210, 255, 0.8);
        }

        .btn-delete {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.12);
          color: rgba(248, 113, 113, 0.9);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-delete:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
          color: rgba(252, 165, 165, 1);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
        }

        .btn-delete:active { transform: translateY(0); }
      `}</style>

      <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="dialog-card">

          {/* Header */}
          <div className="dialog-header">
            <h2 className="dialog-title">
              <AlertTriangle size={16} className="warning-icon" />
              Deactivate Customer
            </h2>
            <button className="dialog-close" onClick={onClose}>
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="dialog-body">
            <p className="dialog-message">
              Are you sure you want to deactivate this customer? Their record will be marked as INACTIVE.
            </p>

            {customer && (
              <div className="customer-highlight">
                <span className="custno">{customer.custno}</span>
                <span style={{ color: 'rgba(180,210,255,0.2)' }}>—</span>
                <span className="custname">{customer.custname}</span>
              </div>
            )}

            <p className="dialog-note">
              * This action can be reversed by an Admin or Superadmin.
            </p>
          </div>

          {/* Footer */}
          <div className="dialog-footer">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button className="btn-delete" onClick={handleConfirm}>
              <Trash2 size={13} />
              Deactivate
            </button>
          </div>

        </div>
      </div>
    </>
  )
}

export default SoftDeleteConfirmDialog