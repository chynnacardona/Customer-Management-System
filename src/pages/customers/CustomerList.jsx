import React, { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, Edit, UserCheck, Loader2, X, ChevronLeft, Trash2 } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'
import AddCustomerModal from '../../components/shared/AddCustomerModal'
import EditCustomerModal from '../../components/shared/EditCustomerModal'
import { customerService } from '../../services/customerService'
import { useAuth } from '../../context/useAuth' 
import { useRights } from '../../context/useRights'
import {
  canAddCustomer as canAddCustomerByRights,
  canEditCustomer as canEditCustomerByRights,
} from '../../utils/accessRules'

function CustomerListPage() {
  const navigate = useNavigate()
  const { user: authUser } = useAuth() 
  const { rights, userType: rightsUserType } = useRights()

  // Identification and Permissions logic
  const metadataName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name
  const databaseName = authUser?.full_name && authUser.full_name.toLowerCase() !== 'admin user' ? authUser.full_name : ''
  const actualDisplayName = databaseName || metadataName || authUser?.email?.split('@')?.[0] || 'System User'
  const actualEmail = authUser?.email ?? 'admin@hope.com'
  const userRole = (rightsUserType ?? authUser?.user_type ?? 'USER').toUpperCase()

  // Strict Role Checks
  const isSuperAdmin = userRole === 'SUPERADMIN'
  const isAdmin = userRole === 'ADMIN'
  const isUser = userRole === 'USER'

  // Action Visibility Logic
  const canSeeAuditHistory = isSuperAdmin || isAdmin
  const canRecoverDeletedRecords = isSuperAdmin || isAdmin
  const canAddCustomer = canAddCustomerByRights(rights)
  const canEditCustomer = canEditCustomerByRights(rights) && (isSuperAdmin || isAdmin)
  const canDeleteCustomer = isSuperAdmin 

  // Component State
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRowId, setSelectedRowId] = useState(null)
  const [timeFilter, setTimeFilter] = useState('ALL')
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [logModal, setLogModal] = useState({ 
    isOpen: false, 
    history: [], 
    view: 'list', 
    selectedEntry: null, 
    rawStampData: '' 
  });

  const fetchCustomersFromDatabase = useCallback(async () => {
    try {
      setIsLoading(true)
      const customerData = await customerService.getCustomers(userRole)
      setCustomers(customerData || [])
    } catch (error) { 
      console.error("Fetch error:", error) 
    } finally { 
      setIsLoading(false) 
    }
  }, [userRole])

  useEffect(() => { 
    fetchCustomersFromDatabase() 
  }, [fetchCustomersFromDatabase])

  const filteredCustomers = customers.filter(customer =>
    (customer.custname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.custno || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleHistoryClick = async (event, stampString, filterType = 'ALL') => {
    if (event) event.stopPropagation();
    
    if (!stampString || stampString === '-' || stampString.trim() === '') {
      setLogModal({ isOpen: true, history: [], view: 'list', selectedEntry: null, rawStampData: stampString });
      return;
    }

    const historyEntries = stampString.split(';');
    const uniqueUserPrefixes = [...new Set(historyEntries.map(entry => entry.split(':')[5]))];

    try {
      const { data: fetchedUsers } = await supabase
        .from('user')
        .select('full_name, email')
        .or(uniqueUserPrefixes.map(prefix => `email.ilike.${prefix}%`).join(','));

      const currentTime = new Date();
      const processedHistory = historyEntries.map(entry => {
        const segments = entry.split(':');
        const dateSegments = segments[0].split('/');
        const entryDateObject = new Date(2026, parseInt(dateSegments[0]) - 1, parseInt(dateSegments[1]));
        
        const userCode = segments[5];
        const isCurrentUser = actualEmail.toLowerCase().startsWith(userCode?.toLowerCase());
        const matchedDatabaseUser = fetchedUsers?.find(user => user.email.toLowerCase().startsWith(userCode?.toLowerCase()));

        const rawDescription = segments[7] || '';
        const legacyMapping = { 'N': 'Name Update', 'A': 'Address Update', 'P': 'Pay Term Update', 'C': 'Record Creation', 'G': 'General Update' };
        const finalDescription = legacyMapping[rawDescription] || rawDescription || 'Record Update';

        let snapshotData = null;
        if (segments[8]) {
            try { snapshotData = JSON.parse(atob(segments[8])); } catch(e) { console.error("Snapshot error", e); }
        }

        return {
          displayDate: `${segments[0]}/26`,
          entryDateObject: entryDateObject,
          militaryTime: segments.slice(1, 4).join(':'),
          actionType: segments[4] === 'C' ? 'Created' : 'Updated',
          userName: isCurrentUser ? actualDisplayName : (matchedDatabaseUser?.full_name || `User (${userCode})`),
          userEmail: isCurrentUser ? actualEmail : (matchedDatabaseUser?.email || `${userCode}@hope.com`),
          systemRole: segments[6] === 'S' ? 'SUPERADMIN' : (segments[6] === 'A' ? 'ADMIN' : 'USER'),
          modificationDescription: finalDescription,
          previousRowSnapshot: snapshotData
        };
      }).filter(item => {
        if (filterType === 'ALL') return true;
        const diffDays = (currentTime - item.entryDateObject) / (1000 * 60 * 60 * 24);
        if (filterType === 'WEEK') return diffDays <= 7;
        if (filterType === 'MONTH') return diffDays <= 30;
        if (filterType === 'YEAR') return diffDays <= 365;
        return true;
      });

      setLogModal({ isOpen: true, history: processedHistory, view: 'list', selectedEntry: null, rawStampData: stampString });
      setTimeFilter(filterType);
    } catch (databaseError) { console.error(databaseError); }
  };

  const handleUpdateCustomer = async (customerNumber, payload) => {
    try {
      const currentCustomerState = customers.find(customer => customer.custno === customerNumber);
      
      let detectedChanges = [];
      if (currentCustomerState.custname !== payload.custname) detectedChanges.push('Name');
      if (currentCustomerState.address !== payload.address) detectedChanges.push('Address');
      if (currentCustomerState.payterm !== payload.payterm) detectedChanges.push('Pay Term');
      
      const changeDescription = detectedChanges.length > 0 
        ? `Modified ${detectedChanges.join(', ')}` 
        : 'General Update';

      const { stamp: _, ...dataToSnapshot } = currentCustomerState;
      const base64Snapshot = btoa(JSON.stringify(dataToSnapshot)); 

      const now = new Date();
      const monthDayString = `${now.getMonth() + 1}/${now.getDate()}`;
      const timeString = now.toLocaleTimeString('en-GB', { hour12: false }); 
      const userPrefix = actualEmail.split('@')[0].substring(0, 3);
      
      const newHistoryEntry = `${monthDayString}:${timeString}:U:${userPrefix}:${userRole[0]}:${changeDescription}:${base64Snapshot}`;
      const existingHistoryEntries = currentCustomerState?.stamp && currentCustomerState.stamp !== '-' ? currentCustomerState.stamp.split(';') : [];
        
      const updatedStampString = [newHistoryEntry, ...existingHistoryEntries].join(';');

      await customerService.updateCustomer(customerNumber, { ...payload, stamp: updatedStampString });
      await fetchCustomersFromDatabase();
      setEditingCustomer(null);
    } catch (e) { console.error(e); }
  }

  const handleAddCustomer = async (payload) => {
    const now = new Date();
    const monthDayString = `${now.getMonth() + 1}/${now.getDate()}`;
    const timeString = now.toLocaleTimeString('en-GB', { hour12: false });
    const userPrefix = actualEmail.split('@')[0].substring(0, 3);
    const initialStamp = `${monthDayString}:${timeString}:C:${userPrefix}:${userRole[0]}:Record Created:`;
    await customerService.addCustomer({ ...payload, stamp: initialStamp });
    await fetchCustomersFromDatabase();
  }

  return (
    <>
      <style>{`
        .customer-list-page { height: 100vh; display: flex; flex-direction: column; padding: 20px; box-sizing: border-box; background: #020617; overflow: hidden; }
        .page-header { flex: 0 0 auto; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .table-frame { flex: 1; display: flex; flex-direction: column; background: #0b1224; border: 1px solid rgba(126, 184, 255, 0.12); border-radius: 12px; overflow: hidden; }
        .scroll-container { flex: 1; overflow-y: auto; overflow-x: auto; }
        
        .c-table { width: 100%; border-collapse: collapse; table-layout: fixed; min-width: 1000px; }
        .c-table thead { position: sticky; top: 0; z-index: 10; background: #111a2e; }
        .c-table th { padding: 12px 10px; text-align: left; font-size: 10px; color: white !important; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 850; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .c-table td { padding: 10px; font-size: 12.5px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.02); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        /* Width adjustments and centering */
        .col-id { width: 65px; } 
        .col-name { width: 220px; } 
        .col-pay { width: 60px; text-align: center; } 
        .col-status { width: 100px; } 
        .col-hist { width: 120px; text-align: center; }
        .col-actions { width: 120px; text-align: center; }

        .action-container { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            gap: 12px; 
            width: 100%; 
            padding-right: 10px; /* Slight offset for perfect optical centering */
        }

        .history-btn { background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 700; text-transform: lowercase; }
        .log-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.88); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .log-modal { background: #0b1224; border: 1px solid #1e293b; width: 380px; height: 550px; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; position: relative; }
        .filter-bar { display: flex; gap: 8px; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px; }
        .filter-btn { background: none; border: none; color: #475569; font-size: 10px; font-weight: 800; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
        .filter-btn.active { color: #38bdf8; background: rgba(56, 189, 248, 0.1); }
        .log-stack { flex: 1; overflow-y: auto; padding-right: 4px; margin-top: 10px; display: flex; flex-direction: column; gap: 12px; }
        .log-stack::-webkit-scrollbar { width: 4px; }
        .log-stack::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .log-card { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 14px; border-radius: 12px; text-align: left; cursor: pointer; border-left: 4px solid transparent; transition: all 0.22s ease; }
        .log-card.latest { border-left-color: #38bdf8; background: rgba(56, 189, 248, 0.12); box-shadow: 0 0 15px rgba(56, 189, 248, 0.15); }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .detail-label { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 800; }
        .detail-val { color: white; font-size: 13px; font-weight: 600; }
        .snapshot-grid { display: grid; grid-template-columns: 100px 1fr; gap: 8px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-top: 10px; }
      `}</style>

      <div className="customer-list-page">
        <header className="page-header">
          <div>
            <h1 style={{color:'white', margin: 0, fontSize: '20px', fontWeight: 800}}>Customer Directory</h1>
            <p style={{color:'#475569', fontSize:'11px'}}>{filteredCustomers.length} total entries</p>
          </div>
          <div style={{display:'flex', gap:'10px'}}>
             <div style={{background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '0 10px', display: 'flex', alignItems: 'center'}}>
                <Search size={14} color="#475569" />
                <input placeholder="Search..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} style={{background:'none', border:'none', color:'white', padding:'8px', outline:'none', fontSize:'12px'}} />
             </div>
             {canRecoverDeletedRecords && (
               <button onClick={() => navigate('/deleted-customers')} style={{background: 'transparent', border: '1px solid #16a34a', color: '#4ade80', padding: '8px 14px', borderRadius: '8px', cursor:'pointer', fontSize:'11px', fontWeight: '800'}}>RECOVER DELETED</button>
             )}
             {canAddCustomer && (
                <button onClick={() => setIsAddModalOpen(true)} style={{background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '11px'}}>+ ADD CUSTOMER</button>
             )}
          </div>
        </header>

        <div className="table-frame">
          <div className="scroll-container">
            <table className="c-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th className="col-name">Name</th>
                  <th className="col-pay">Pay</th>
                  <th>Address</th>
                  <th className="col-status">Status</th>
                  {canSeeAuditHistory && <th className="col-hist" style={{textAlign:'center'}}>Stamp</th>}
                  <th className="col-actions" style={{textAlign:'center'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} style={{textAlign:'center', padding:'40px'}}><Loader2 className="animate-spin mx-auto" color="#38bdf8"/></td></tr>
                ) : filteredCustomers.map((customer) => (
                  <tr key={customer.custno} onClick={() => setSelectedRowId(customer.custno)} style={{background: selectedRowId === customer.custno ? 'rgba(56, 189, 248, 0.08)' : 'transparent'}}>
                    <td style={{fontFamily:'monospace', color: '#475569'}}>{customer.custno}</td>
                    <td style={{color: 'white', fontWeight: '800'}}>{customer.custname}</td>
                    <td style={{textAlign:'center', fontWeight:'900', color: '#64748b'}}>{customer.payterm}</td>
                    <td>{customer.address}</td>
                    <td><div style={{color:'#22c55e', fontSize:'11px', fontWeight:'850', display:'flex', alignItems:'center', gap:'5px'}}><UserCheck size={14}/> {customer.record_status}</div></td>
                    
                    {canSeeAuditHistory && (
                      <td className="col-hist" onClick={(event) => event.stopPropagation()}>
                        <button className="history-btn" onClick={(event) => handleHistoryClick(event, customer.stamp)}>View</button>
                      </td>
                    )}

                    <td className="col-actions" onClick={(event) => event.stopPropagation()}>
                        <div className="action-container">
                          {/* View Button - Visible to all roles */}
                          <button onClick={() => navigate(`/customers/${customer.custno}`)} style={{background:'none', border:'none', color:'#475569', cursor:'pointer'}}><Eye size={15}/></button>
                          
                          {/* Edit Button - SuperAdmin/Admin */}
                          {canEditCustomer && (
                            <button onClick={() => setEditingCustomer(customer)} style={{background:'none', border:'none', color:'#475569', cursor:'pointer'}}><Edit size={15}/></button>
                          )}

                          {/* Delete Button - STRICTLY SuperAdmin Only */}
                          {canDeleteCustomer && (
                            <button onClick={() => {}} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer'}}><Trash2 size={15}/></button>
                          )}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {logModal.isOpen && (
        <div className="log-overlay" onClick={() => setLogModal({ ...logModal, isOpen: false })}>
          <div className="log-modal" onClick={event => event.stopPropagation()}>
            <X size={20} color="#64748b" style={{position:'absolute', top:'24px', right:'24px', cursor:'pointer', zIndex: 10}} onClick={() => setLogModal({ ...logModal, isOpen: false })} />

            {logModal.view === 'list' ? (
              <>
                <h3 style={{color:'white', fontSize:'16px', margin:'0 0 10px 0', fontWeight: 850}}>Audit Stack</h3>
                <div className="filter-bar">
                  {['ALL', 'WEEK', 'MONTH', 'YEAR'].map(option => (
                    <button key={option} className={`filter-btn ${timeFilter === option ? 'active' : ''}`} onClick={() => handleHistoryClick(null, logModal.rawStampData, option)}>{option}</button>
                  ))}
                </div>
                <div className="log-stack">
                  {logModal.history.length > 0 ? logModal.history.map((item, index) => (
                    <div key={index} className={`log-card ${index === 0 ? 'latest' : ''}`} onClick={() => setLogModal({...logModal, view: 'detail', selectedEntry: item})}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems: 'flex-start'}}>
                        <span style={{fontSize:'10px', color:'#38bdf8', fontWeight:900}}>{item.actionType.toUpperCase()}</span>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                          <span style={{fontSize:'11px', color:'#38bdf8', fontWeight:900}}>{item.displayDate}</span>
                          <span style={{fontSize: '10px', color: '#475569', fontWeight: 700, marginTop: '2px'}}>{item.militaryTime}</span>
                        </div>
                      </div>
                      <div style={{color:'white', fontSize:'13px', marginTop:'6px', fontWeight: 700}}>{item.modificationDescription}</div>
                      <div style={{color:'#64748b', fontSize:'11px'}}>by {item.userName}</div>
                    </div>
                  )) : <p style={{color: '#475569', fontSize: '12px', textAlign: 'center', marginTop: '40px'}}>No entries found</p>}
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setLogModal({...logModal, view: 'list', selectedEntry: null})} style={{background:'none', border:'none', color:'#38bdf8', fontSize:'12px', display:'flex', alignItems:'center', gap:'4px', cursor:'pointer', marginBottom:'25px', padding:0, fontWeight: 800}}>
                  <ChevronLeft size={18}/> Back to History
                </button>
                <div className="detail-row"><span className="detail-label">Modification</span><span className="detail-val" style={{color:'#38bdf8'}}>{logModal.selectedEntry.modificationDescription}</span></div>
                <div className="detail-row"><span className="detail-label">Actual Name</span><span className="detail-val">{logModal.selectedEntry.userName}</span></div>
                <div className="detail-row"><span className="detail-label">Actual Email</span><span className="detail-val">{logModal.selectedEntry.userEmail}</span></div>
                <div className="detail-row"><span className="detail-label">System Role</span><span className="detail-val" style={{color:'#facc15'}}>{logModal.selectedEntry.systemRole}</span></div>
                <div className="detail-row"><span className="detail-label">Timestamp</span><span className="detail-val">{logModal.selectedEntry.displayDate} | {logModal.selectedEntry.militaryTime}</span></div>
                {logModal.selectedEntry.previousRowSnapshot && (
                  <div style={{ marginTop: '20px', borderTop: '1px solid #1e293b', paddingTop: '15px', overflowY: 'auto' }}>
                    <p style={{ color: '#38bdf8', fontSize: '10px', fontWeight: 900, marginBottom: '12px', textTransform: 'uppercase' }}>View Past Row</p>
                    <div className="snapshot-grid">
                      {Object.entries(logModal.selectedEntry.previousRowSnapshot).map(([key, value]) => (
                        <React.Fragment key={key}>
                          <div style={{ color: '#475569', fontSize: '10px', fontWeight: 800 }}>{key.toUpperCase()}</div>
                          <div style={{ color: '#94a3b8', fontSize: '11px', textAlign: 'right', wordBreak: 'break-all' }}>{String(value ?? '-')}</div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <EditCustomerModal isOpen={Boolean(editingCustomer)} customer={editingCustomer} onClose={() => setEditingCustomer(null)} onSubmit={handleUpdateCustomer} />
      <AddCustomerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddCustomer} />
    </>
  )
}

export default CustomerListPage;
