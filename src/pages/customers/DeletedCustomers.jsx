import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Loader2, RotateCcw, Search, ShieldCheck, Trash2 } from 'lucide-react'
import FilterDropdown from '../../components/shared/FilterDropdown'
import { useAuth } from '../../context/useAuth'
import { supabase } from '../../supabase/supabaseClient'
import { customerService } from '../../services/customerService'
import { canManageDeletedCustomers } from '../../utils/accessRules'

// --- Formatting Helper Component ---
function FormattedStamp({ stamp, userMap }) {
  if (!stamp || stamp === '-' || stamp.trim() === '') return <span className="deleted-stamp">INACTIVE</span>;

  const firstEntry = stamp.split(';')[0];
  const parts = firstEntry.split(':');

  // Format: MM/DD/YYYY | 00:00:00
  const date = parts[0];
  const time = parts.slice(1, 4).join(':');
  const userCode = parts[5]?.toLowerCase();

  // Fetch email from the pre-built map
  const userEmail = userMap[userCode] || `${userCode}@hope.com`;

  return (
    <div className="deleted-stamp" style={{ fontSize: '11.5px', lineHeight: '1.4' }}>
      <div style={{ opacity: 0.8 }}>
        {date}/2026 | {time}
      </div>
      <div style={{ color: 'rgba(180, 210, 255, 0.7)', fontWeight: '600' }}>
        {userEmail}
      </div>
    </div>
  );
}

function DeletedCustomers() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [recoveringCustno, setRecoveringCustno] = useState(null)
  const [customers, setCustomers] = useState([])
  const [userMap, setUserMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const userRole = (user?.user_type ?? 'USER').toUpperCase()
  const isSuperAdmin = userRole === 'SUPERADMIN'
  const canViewDeletedCustomers = canManageDeletedCustomers(userRole)

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

      const prefixes = [...new Set(data
        .map(c => c.stamp?.split(';')[0]?.split(':')[5])
        .filter(Boolean)
      )];

      if (prefixes.length > 0) {
        const { data: databaseUsers } = await supabase
          .from('user')
          .select('email')
          .or(prefixes.map(p => `email.ilike.${p}%`).join(','));

        const mapping = {};
        databaseUsers?.forEach(dbUser => {
          const prefix = dbUser.email.split('@')[0].substring(0, 3).toLowerCase();
          mapping[prefix] = dbUser.email;
        });
        setUserMap(mapping);
      }
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
        (customer.stamp || '').toLowerCase().includes(term)
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [customers, search, statusFilter])

  const handleRecover = async (customer) => {
    if (!isSuperAdmin) return; // Guard clause
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
        @keyframes deletedPageIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .deleted-page { animation: deletedPageIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards; display: flex; flex-direction: column; gap: 18px; height: 100%; }
        .deleted-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .deleted-title-wrap { display: flex; align-items: center; gap: 12px; }
        .deleted-title-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fca5a5; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.16); }
        .deleted-title { font-size: 20px; font-weight: 800; color: white; margin: 0; }
        .deleted-subtitle { font-size: 12px; color: rgba(180, 210, 255, 0.35); margin: 6px 0 0; }
        .deleted-filters { display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-wrap: nowrap; }
        .deleted-filters .filter-dropdown { flex: 0 0 148px; }
        .deleted-search { display: flex; align-items: center; gap: 8px; flex: 0 1 320px; min-width: 260px; background: rgba(126, 184, 255, 0.04); border: 1px solid rgba(126, 184, 255, 0.12); border-radius: 10px; padding: 8px 12px; }
        .deleted-search input { width: 100%; border: none; outline: none; background: transparent; color: rgba(220, 235, 255, 0.86); font-size: 12.5px; }
        .deleted-table-card { background: linear-gradient(145deg, rgba(8, 18, 40, 0.84), rgba(3, 9, 24, 0.9)); border: 1px solid rgba(126, 184, 255, 0.12); border-radius: 18px; overflow: hidden; flex: 1; display: flex; flex-direction: column; }
        .deleted-table-scroll { flex: 1; overflow: auto; }
        .deleted-table { width: 100%; border-collapse: collapse; }
        .deleted-table th { padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 700; color: rgba(180, 210, 255, 0.35); letter-spacing: 0.12em; text-transform: uppercase; background: rgba(6, 16, 36, 0.96); border-bottom: 1px solid rgba(100, 160, 255, 0.08); }
        .deleted-table td { padding: 13px 16px; font-size: 12.5px; color: rgba(180, 210, 255, 0.68); border-bottom: 1px solid rgba(100, 160, 255, 0.05); }
        
        /* Centering Logic */
        .col-action-header { text-align: center !important; }
        .col-action-cell { display: flex; justify-content: center; align-items: center; }

        .deleted-custname { color: rgba(220, 235, 255, 0.9) !important; font-weight: 700; }
        .deleted-status { display: inline-flex; align-items: center; justify-content: center; min-width: 86px; min-height: 26px; border-radius: 999px; border: 1px solid rgba(248, 113, 113, 0.22); background: rgba(239, 68, 68, 0.1); color: rgba(252, 165, 165, 0.96); font-size: 10.5px; font-weight: 900; }
        
        .recover-btn { 
          display: inline-flex; 
          align-items: center; 
          gap: 6px; 
          padding: 7px 14px; 
          border-radius: 9px; 
          border: 1px solid rgba(34, 197, 94, 0.18); 
          background: rgba(34, 197, 94, 0.08); 
          color: rgba(134, 239, 172, 0.92); 
          font-size: 12px; 
          font-weight: 800; 
          cursor: pointer; 
          transition: all 0.2s ease;
        }

        .recover-btn:hover:not(:disabled) { background: rgba(34, 197, 94, 0.15); transform: translateY(-1px); }
        
        /* Admin restricted state */
        .recover-btn:disabled { 
          opacity: 0.35; 
          cursor: not-allowed; 
          filter: grayscale(1);
        }

        .deleted-summary-card { padding: 14px 16px; background: rgba(8, 18, 40, 0.5); border: 1px solid rgba(126, 184, 255, 0.12); border-radius: 18px; display: flex; justify-content: space-between; align-items: center; }
        .deleted-role-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; color: rgba(126, 184, 255, 0.9); background: rgba(46, 134, 245, 0.1); border: 1px solid rgba(100, 160, 255, 0.16); font-size: 11px; font-weight: 800; }
        @media (max-width: 760px) {
          .deleted-filters { width: 100%; flex-wrap: wrap; justify-content: stretch; }
          .deleted-search { flex: 1 1 100%; min-width: 100%; }
          .deleted-filters .filter-dropdown { flex: 1 1 148px; }
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
          {canViewDeletedCustomers && (
            <div className="deleted-filters">
              <div className="deleted-search">
                <Search size={14} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records..." />
              </div>
              <FilterDropdown
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[{ value: 'ALL', label: 'All' }, { value: 'INACTIVE', label: 'Inactive' }, { value: 'DELETED', label: 'Deleted' }]}
              />
            </div>
          )}
        </div>

        {!canViewDeletedCustomers ? (
          <section className="deleted-access-card">
            <AlertTriangle size={20} />
            <div style={{ marginLeft: '12px' }}>
              <span style={{ display: 'block', fontWeight: '800' }}>Admin access required</span>
            </div>
          </section>
        ) : (
          <>
            {error && (
              <section className="deleted-access-card" style={{ color: 'rgba(252, 165, 165, 0.95)' }}>
                <AlertTriangle size={20} />
                <div style={{ marginLeft: '12px' }}>
                  <span style={{ display: 'block', fontWeight: '800' }}>{error}</span>
                </div>
              </section>
            )}
            <section className="deleted-summary-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Trash2 size={17} color="rgba(126, 184, 255, 0.76)" />
                <span style={{ fontWeight: '800', fontSize: '15px', color: 'white' }}>{filteredCustomers.length} Records</span>
              </div>
              <span className="deleted-role-badge"><ShieldCheck size={13} /> {userRole}</span>
            </section>

            <section className="deleted-table-card">
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin mx-auto text-blue-400" size={28} /></div>
              ) : (
                <div className="deleted-table-scroll">
                  <table className="deleted-table">
                    <thead>
                      <tr>
                        <th style={{ width: '12%' }}>Cust No</th>
                        <th style={{ width: '25%' }}>Customer Name</th>
                        <th style={{ width: '15%' }}>Status</th>
                        <th style={{ width: '33%' }}>Stamp</th>
                        <th style={{ width: '15%' }} className="col-action-header">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.custno}>
                          <td style={{ fontFamily: 'monospace', opacity: 0.5 }}>{customer.custno}</td>
                          <td className="deleted-custname">{customer.custname}</td>
                          <td><span className="deleted-status">{customer.record_status || 'INACTIVE'}</span></td>
                          <td><FormattedStamp stamp={customer.stamp} userMap={userMap} /></td>
                          <td className="col-action-cell">
                            <button 
                              className="recover-btn" 
                              disabled={recoveringCustno === customer.custno || !isSuperAdmin} 
                              onClick={() => handleRecover(customer)}
                              title={!isSuperAdmin ? "Only SuperAdmins can recover records" : ""}
                            >
                              <RotateCcw size={13} /> 
                              {recoveringCustno === customer.custno ? '...' : 'Recover'}
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

export default DeletedCustomers;
