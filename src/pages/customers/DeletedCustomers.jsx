import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Loader2, RotateCcw, Search, ShieldCheck, Trash2 } from 'lucide-react'
import FilterDropdown from '../../components/shared/FilterDropdown'
import { useAuth } from '../../context/useAuth'
import { customerService } from '../../services/customerService'
import { canManageDeletedCustomers } from '../../utils/accessRules'

function DeletedCustomers() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [recoveringCustno, setRecoveringCustno] = useState(null)
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const userType = user?.user_type ?? 'USER'
  const canViewDeletedCustomers = canManageDeletedCustomers(userType)

  const loadDeletedCustomers = useCallback(async () => {
    if (!canViewDeletedCustomers) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      const data = await customerService.getDeletedCustomers()
      setCustomers(data || [])
    } catch (err) {
      setError(err.message || 'Unable to load inactive customers.')
    } finally {
      setLoading(false)
    }
  }, [canViewDeletedCustomers])

  useEffect(() => {
    loadDeletedCustomers()
  }, [loadDeletedCustomers])

  const filteredCustomers = useMemo(() => {
    const term = search.toLowerCase().trim()

    return customers.filter((customer) => {
      const status = String(customer.record_status || '').toUpperCase()
      const matchesSearch =
        !term ||
        customer.custno.toLowerCase().includes(term) ||
        customer.custname.toLowerCase().includes(term) ||
        (customer.stamp || customer.record_status || '').toLowerCase().includes(term)
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [customers, search, statusFilter])

  const handleRecover = async (customer) => {
    try {
      setRecoveringCustno(customer.custno)
      setError('')
      await customerService.recoverCustomer(customer.custno)
      await loadDeletedCustomers()
    } catch (err) {
      setError(err.message || 'Unable to recover customer.')
    } finally {
      setRecoveringCustno(null)
    }
  }

  return (
    <>
      <style>{`
        @keyframes deletedPageIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes deletedCardIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .deleted-page {
          animation: deletedPageIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          display: flex;
          flex-direction: column;
          gap: 18px;
          height: 100%;
          min-height: 0;
        }

        .deleted-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .deleted-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .deleted-title-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.16);
          box-shadow: 0 8px 24px rgba(120, 30, 30, 0.18);
        }

        .deleted-title {
          font-size: 20px;
          font-weight: 800;
          color: white;
          margin: 0;
          line-height: 1;
          letter-spacing: 0;
        }

        .deleted-subtitle {
          font-size: 12px;
          color: rgba(180, 210, 255, 0.35);
          margin: 6px 0 0;
        }

        .deleted-search {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 270px;
          background: rgba(126, 184, 255, 0.04);
          border: 1px solid rgba(126, 184, 255, 0.12);
          border-radius: 10px;
          padding: 8px 12px;
          transition: all 0.2s ease;
        }

        .deleted-search:focus-within {
          border-color: rgba(56, 189, 248, 0.34);
          background: rgba(126, 184, 255, 0.07);
          box-shadow: 0 0 0 3px rgba(46, 134, 245, 0.1);
        }

        .deleted-search svg {
          color: rgba(180, 210, 255, 0.28);
          flex-shrink: 0;
        }

        .deleted-search input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: rgba(220, 235, 255, 0.86);
          font-size: 12.5px;
        }

        .deleted-search input::placeholder {
          color: rgba(180, 210, 255, 0.24);
        }

        .deleted-filters {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .deleted-access-card,
        .deleted-summary-card,
        .deleted-table-card {
          background: linear-gradient(180deg, rgba(126, 184, 255, 0.035), transparent 44%), linear-gradient(145deg, rgba(8, 18, 40, 0.84), rgba(3, 9, 24, 0.9));
          border: 1px solid rgba(126, 184, 255, 0.12);
          border-radius: 18px;
          box-shadow: 0 18px 38px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.045);
          animation: deletedCardIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }

        .deleted-access-card:hover,
        .deleted-summary-card:hover,
        .deleted-table-card:hover {
          transform: translateY(-2px);
          border-color: rgba(126, 184, 255, 0.24);
          box-shadow: 0 22px 48px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255,255,255,0.07);
        }

        .deleted-access-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px;
          color: rgba(220, 235, 255, 0.78);
        }

        .deleted-access-card svg {
          color: #fca5a5;
          flex-shrink: 0;
        }

        .deleted-access-title {
          display: block;
          color: rgba(235, 245, 255, 0.92);
          font-size: 14px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .deleted-access-copy {
          color: rgba(180, 210, 255, 0.44);
          font-size: 12.5px;
          margin: 0;
        }

        .deleted-summary-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
        }

        .deleted-summary-left {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(126, 184, 255, 0.76);
        }

        .deleted-summary-label {
          display: block;
          font-size: 9px;
          font-weight: 700;
          color: rgba(180, 210, 255, 0.3);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .deleted-summary-value {
          display: block;
          color: rgba(235, 245, 255, 0.92);
          font-size: 15px;
          font-weight: 800;
        }

        .deleted-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          color: rgba(126, 184, 255, 0.9);
          background: rgba(46, 134, 245, 0.1);
          border: 1px solid rgba(100, 160, 255, 0.16);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .deleted-table-card {
          overflow: hidden;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .deleted-table-scroll {
          flex: 1;
          min-height: 0;
          overflow-x: auto;
          overflow-y: auto;
        }

        .deleted-table {
          width: 100%;
          border-collapse: collapse;
        }

        .deleted-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          color: rgba(180, 210, 255, 0.35);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
          background: rgba(6, 16, 36, 0.96);
          border-bottom: 1px solid rgba(100, 160, 255, 0.08);
        }

        .deleted-table td {
          padding: 13px 16px;
          font-size: 12.5px;
          color: rgba(180, 210, 255, 0.68);
          white-space: nowrap;
          border-bottom: 1px solid rgba(100, 160, 255, 0.05);
        }

        .deleted-table tbody tr:last-child td {
          border-bottom: none;
        }

        .deleted-table tbody tr:hover {
          background: rgba(126, 184, 255, 0.07);
          box-shadow: inset 3px 0 0 rgba(56, 189, 248, 0.75);
        }

        .deleted-table tbody tr {
          transition: background 0.18s ease, box-shadow 0.18s ease;
        }

        .deleted-custno {
          font-family: monospace;
          color: rgba(180, 210, 255, 0.52) !important;
          font-weight: 700;
        }

        .deleted-custname {
          color: rgba(220, 235, 255, 0.9) !important;
          font-weight: 700;
        }

        .deleted-stamp {
          color: rgba(180, 210, 255, 0.44) !important;
          min-width: 280px;
        }

        .deleted-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 86px;
          min-height: 26px;
          border-radius: 999px;
          border: 1px solid rgba(248, 113, 113, 0.22);
          background: rgba(239, 68, 68, 0.1);
          color: rgba(252, 165, 165, 0.96);
          font-size: 10.5px;
          font-weight: 900;
          letter-spacing: 0.06em;
        }

        .recover-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 9px;
          border: 1px solid rgba(34, 197, 94, 0.18);
          background: rgba(34, 197, 94, 0.08);
          color: rgba(134, 239, 172, 0.92);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
        }

        .recover-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          background: rgba(34, 197, 94, 0.13);
          border-color: rgba(34, 197, 94, 0.28);
          box-shadow: 0 10px 24px rgba(34, 197, 94, 0.14);
        }

        .recover-btn:disabled {
          opacity: 0.58;
          cursor: wait;
        }

        .deleted-empty {
          padding: 48px 16px;
          text-align: center;
          color: rgba(180, 210, 255, 0.28);
          font-size: 13px;
        }

        .deleted-error {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(248, 113, 113, 0.2);
          background: rgba(239, 68, 68, 0.08);
          color: rgba(252, 165, 165, 0.95);
          font-size: 12.5px;
        }

        @media (max-width: 780px) {
          .deleted-search { min-width: 100%; }
          .deleted-filters { width: 100%; }
          .deleted-summary-card {
            align-items: flex-start;
            flex-direction: column;
          }
          .deleted-table { min-width: 760px; }
        }
      `}</style>

      <div className="deleted-page">
        <div className="deleted-header">
          <div className="deleted-title-wrap">
            <div className="deleted-title-icon"><Trash2 size={20} /></div>
            <div>
              <h1 className="deleted-title">Deleted Customers</h1>
              <p className="deleted-subtitle">Inactive customer records available for recovery</p>
          </div>
        </div>

        {error && <div className="deleted-error">{error}</div>}

          {canViewDeletedCustomers && (
            <div className="deleted-filters">
              <div className="deleted-search">
                <Search size={14} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer number, name, stamp..."
                />
              </div>
              <FilterDropdown
                label="Deleted status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'ALL', label: 'All Deleted' },
                  { value: 'INACTIVE', label: 'Inactive' },
                  { value: 'DELETED', label: 'Deleted' },
                ]}
              />
            </div>
          )}
        </div>

        {!canViewDeletedCustomers ? (
          <section className="deleted-access-card">
            <AlertTriangle size={20} />
            <div>
              <span className="deleted-access-title">Admin access required</span>
              <p className="deleted-access-copy">
                Deleted Customers is hidden from USER accounts and available only to ADMIN and SUPERADMIN users.
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className="deleted-summary-card">
              <div className="deleted-summary-left">
                <Trash2 size={17} />
                <div>
                  <span className="deleted-summary-label">Inactive Customers</span>
                  <span className="deleted-summary-value">{filteredCustomers.length}</span>
                </div>
              </div>
              <span className="deleted-role-badge">
                <ShieldCheck size={13} />
                {userType}
              </span>
            </section>

            <section className="deleted-table-card">
              {loading ? (
                <div className="deleted-empty">
                  <Loader2 className="animate-spin mb-3 mx-auto text-blue-400" size={28} />
                  <p>Loading inactive customers...</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="deleted-empty">No inactive customers found</div>
              ) : (
                <div className="deleted-table-scroll">
                  <table className="deleted-table">
                    <thead>
                      <tr>
                        <th>Cust No</th>
                        <th>Customer Name</th>
                        <th>Status</th>
                        <th>Stamp</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.custno}>
                          <td className="deleted-custno">{customer.custno}</td>
                          <td className="deleted-custname">{customer.custname}</td>
                          <td><span className="deleted-status">{customer.record_status || 'INACTIVE'}</span></td>
                          <td className="deleted-stamp">{customer.stamp || customer.record_status || 'INACTIVE'}</td>
                          <td>
                            <button
                              className="recover-btn"
                              disabled={recoveringCustno === customer.custno}
                              onClick={() => handleRecover(customer)}
                            >
                              <RotateCcw size={13} />
                              {recoveringCustno === customer.custno ? 'Recovering' : 'Recover'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  )
}

export default DeletedCustomers
