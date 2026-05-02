import { useState } from 'react'
import { X, Plus } from 'lucide-react'

// para kay M1: i-replace yung onSubmit handler ng actual na addCustomer() API call
function AddCustomerModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    custno: '',
    custname: '',
    address: '',
    payterm: 'COD',
  })

  if (!isOpen) return null

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = () => {
    // para kay M1: ilagay dito yung addCustomer(form) API call
    console.log('Add Customer:', form)
    onClose()
  }

  return (
    <>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(1, 6, 18, 0.7);
          backdrop-filter: blur(6px);
          padding: 16px;
        }

        .modal-card {
          width: 100%;
          max-width: 440px;
          background: rgba(8, 18, 40, 0.95);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(100, 160, 255, 0.12);
          border-radius: 20px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
          animation: modalIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid rgba(100, 160, 255, 0.07);
        }

        .modal-title {
          font-size: 15px;
          font-weight: 700;
          color: white;
          letter-spacing: 0.02em;
          margin: 0;
        }

        .modal-close {
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

        .modal-close:hover {
          background: rgba(255, 70, 70, 0.08);
          border-color: rgba(255, 70, 70, 0.15);
          color: rgba(255, 100, 100, 0.8);
        }

        .modal-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 10px;
          font-weight: 700;
          color: rgba(180, 210, 255, 0.38);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .form-input {
          background: rgba(100, 160, 255, 0.04);
          border: 1px solid rgba(100, 160, 255, 0.1);
          border-radius: 10px;
          color: white;
          font-size: 13px;
          padding: 9px 14px;
          outline: none;
          transition: all 0.2s ease;
          width: 100%;
          box-sizing: border-box;
        }

        .form-input::placeholder { color: rgba(180, 210, 255, 0.2); }

        .form-input:focus {
          border-color: rgba(80, 140, 255, 0.5);
          background: rgba(80, 140, 255, 0.06);
          box-shadow: 0 0 0 3px rgba(60, 120, 255, 0.08);
        }

        .form-select {
          background: rgba(100, 160, 255, 0.04);
          border: 1px solid rgba(100, 160, 255, 0.1);
          border-radius: 10px;
          color: white;
          font-size: 13px;
          padding: 9px 14px;
          outline: none;
          transition: all 0.2s ease;
          width: 100%;
          box-sizing: border-box;
          cursor: pointer;
          appearance: none;
        }

        .form-select option {
          background: #0a1628;
          color: white;
        }

        .form-select:focus {
          border-color: rgba(80, 140, 255, 0.5);
          background: rgba(80, 140, 255, 0.06);
          box-shadow: 0 0 0 3px rgba(60, 120, 255, 0.08);
        }

        .modal-footer {
          padding: 14px 20px;
          border-top: 1px solid rgba(100, 160, 255, 0.07);
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

        .btn-submit {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #1a4fd6, #2e86f5);
          color: white;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(30, 80, 220, 0.4);
        }

        .btn-submit:active { transform: translateY(0); }
      `}</style>

      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-card">

          {/* Header */}
          <div className="modal-header">
            <h2 className="modal-title">Add Customer</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body">

            <div className="form-group">
              <label className="form-label">Customer No.</label>
              <input
                className="form-input"
                name="custno"
                placeholder="e.g. C0013"
                value={form.custno}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input
                className="form-input"
                name="custname"
                placeholder="Enter full name"
                value={form.custname}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                className="form-input"
                name="address"
                placeholder="Enter address"
                value={form.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pay Term</label>
              <select
                className="form-select"
                name="payterm"
                value={form.payterm}
                onChange={handleChange}
              >
                <option value="COD">COD</option>
                <option value="30D">30D</option>
                <option value="45D">45D</option>
              </select>
            </div>

          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button className="btn-submit" onClick={handleSubmit}>
              <Plus size={13} />
              Add Customer
            </button>
          </div>

        </div>
      </div>
    </>
  )
}

export default AddCustomerModal