import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, ChevronUp, ClipboardList, Loader2, Radio, Search } from 'lucide-react'
import FilterDropdown from '../../components/shared/FilterDropdown'
import DatePickerField from '../../components/shared/DatePickerField'
import { getAuditLogs, subscribeToAuditLogs } from '../../services/auditLogService'
import { getLocalDateKey, getLocalDayIsoRange } from '../../utils/auditLogDates'

function AuditLogs() {
  const [auditRows, setAuditRows] = useState([])
  const [search, setSearch] = useState('')
  const [dateRangeMode, setDateRangeMode] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const effectiveDateFrom = dateRangeMode === 'CUSTOM' ? dateFrom || dateTo : ''
  const effectiveDateTo = dateRangeMode === 'CUSTOM' ? dateTo || dateFrom : ''

  useEffect(() => {
    let mounted = true
    let unsubscribe = () => {}

    const loadLogs = async () => {
      try {
        setLoading(true)
        setError('')
        const { startIso } = getLocalDayIsoRange(effectiveDateFrom)
        const { endIso } = getLocalDayIsoRange(effectiveDateTo)
        const rows = await getAuditLogs({ limit: 500, startIso, endIso })
        if (!mounted) return
        setAuditRows(rows)
        unsubscribe = subscribeToAuditLogs((newLog) => {
          const logDate = getLocalDateKey(newLog?.created_at)
          const isWithinFrom = !effectiveDateFrom || logDate >= effectiveDateFrom
          const isWithinTo = !effectiveDateTo || logDate <= effectiveDateTo
          if (!isWithinFrom || !isWithinTo) return

          setAuditRows((current) => [newLog, ...current].slice(0, 500))
        })
      } catch (err) {
        if (mounted) setError(err.message || 'Unable to load audit logs.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadLogs()

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [effectiveDateFrom, effectiveDateTo])

  const formatTimestamp = (value) => {
    if (!value) return '-'
    return new Intl.DateTimeFormat('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date(value))
  }

  const filteredAuditRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = auditRows.filter((row) => {
      const dateValue = getLocalDateKey(row.created_at)
      const metadata = JSON.stringify(row.metadata || {})
      const searchable = [
        row.created_at,
        formatTimestamp(row.created_at),
        row.actor_email,
        row.actor_user_id,
        row.actor_role,
        row.action,
        row.entity_type,
        row.entity_id,
        metadata,
      ]

      const matchesSearch = !term || searchable.some((value) => String(value || '').toLowerCase().includes(term))
      const matchesFrom = !effectiveDateFrom || dateValue >= effectiveDateFrom
      const matchesTo = !effectiveDateTo || dateValue <= effectiveDateTo

      return matchesSearch && matchesFrom && matchesTo
    })

    const direction = sortConfig.direction === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const aValue = sortConfig.key === 'entity'
        ? `${a.entity_type || ''} ${a.entity_id || ''}`
        : a[sortConfig.key]
      const bValue = sortConfig.key === 'entity'
        ? `${b.entity_type || ''} ${b.entity_id || ''}`
        : b[sortConfig.key]
      return String(aValue || '').localeCompare(String(bValue || '')) * direction
    })
  }, [auditRows, effectiveDateFrom, effectiveDateTo, search, sortConfig])

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const sortLabel = (key, label) => {
    const active = sortConfig.key === key
    const SortIcon = sortConfig.direction === 'asc' ? ChevronUp : ChevronDown
    return (
      <>
        <span>{label}</span>
        {active && <SortIcon className="sort-side-icon" size={13} />}
      </>
    )
  }

  return (
    <>
      <style>{`
        .audit-logs-page {
          animation: auditLogsIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-height: 100%;
        }

        @keyframes auditLogsIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .audit-logs-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .audit-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 32px;
          padding: 0 11px;
          border-radius: 999px;
          border: 1px solid rgba(34, 197, 94, 0.18);
          background: rgba(34, 197, 94, 0.08);
          color: rgba(134, 239, 172, 0.95);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .audit-live-badge svg {
          animation: auditPulse 1.4s ease-in-out infinite;
        }

        .audit-toolbar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .audit-search {
          min-width: 300px;
          min-height: 36px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 10px;
          border: 1px solid rgba(126, 184, 255, 0.14);
          background: rgba(126, 184, 255, 0.045);
          padding: 0 11px;
        }

        .audit-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: rgba(225, 238, 255, 0.9);
          font-size: 12.5px;
        }

        .audit-search svg {
          color: rgba(180, 210, 255, 0.34);
          flex-shrink: 0;
        }

        .audit-sort-btn {
          border: 0;
          padding: 0;
          background: transparent;
          color: inherit;
          font: inherit;
          text-transform: inherit;
          letter-spacing: inherit;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .audit-sort-btn:hover {
          color: rgba(224, 242, 254, 0.96);
        }

        .sort-side-icon {
          color: rgba(56, 189, 248, 0.95);
          flex-shrink: 0;
          stroke-width: 2.8;
        }

        @keyframes auditPulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }

        .audit-logs-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .audit-logs-title-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #93c5fd;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(147, 197, 253, 0.18);
          box-shadow: 0 8px 24px rgba(30, 64, 175, 0.18);
        }

        .audit-logs-title {
          margin: 0;
          color: rgba(245, 250, 255, 0.96);
          font-size: 20px;
          font-weight: 850;
          line-height: 1;
          letter-spacing: 0;
        }

        .audit-logs-subtitle {
          margin: 6px 0 0;
          color: rgba(180, 210, 255, 0.38);
          font-size: 12.5px;
        }

        .audit-logs-table-card {
          overflow: hidden;
          background: rgba(8, 18, 40, 0.62);
          border: 1px solid rgba(100, 160, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .audit-logs-table-scroll {
          overflow-x: auto;
        }

        .audit-logs-table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
        }

        .audit-logs-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 10px;
          font-weight: 800;
          color: rgba(180, 210, 255, 0.38);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
          background: rgba(100, 160, 255, 0.03);
          border-bottom: 1px solid rgba(100, 160, 255, 0.08);
        }

        .audit-logs-table td {
          padding: 13px 16px;
          font-size: 12.5px;
          color: rgba(180, 210, 255, 0.68);
          border-bottom: 1px solid rgba(100, 160, 255, 0.05);
          vertical-align: middle;
        }

        .audit-logs-table tbody tr:last-child td {
          border-bottom: none;
        }

        .audit-logs-table tbody tr:hover {
          background: rgba(100, 160, 255, 0.06);
        }

        .audit-role-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 74px;
          min-height: 24px;
          padding: 0 8px;
          border-radius: 999px;
          border: 1px solid rgba(100, 160, 255, 0.14);
          font-size: 10.5px;
          font-weight: 850;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .audit-role-badge.admin {
          color: rgba(147, 197, 253, 0.96);
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(147, 197, 253, 0.18);
        }

        .audit-role-badge.user {
          color: rgba(196, 181, 253, 0.96);
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(196, 181, 253, 0.18);
        }

        .audit-entity {
          color: rgba(235, 245, 255, 0.9);
          font-weight: 800;
        }

        .audit-meta {
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(180, 210, 255, 0.42) !important;
          font-family: monospace;
          font-size: 11.5px !important;
        }

        .audit-feedback {
          padding: 14px 16px;
          color: rgba(180, 210, 255, 0.36);
          text-align: center;
          font-size: 13px;
        }

        .audit-feedback.error {
          color: rgba(252, 165, 165, 0.95);
        }
      `}</style>

      <div className="audit-logs-page">
        <div className="audit-logs-header">
          <div className="audit-logs-title-wrap">
            <div className="audit-logs-title-icon"><ClipboardList size={20} /></div>
            <div>
              <h1 className="audit-logs-title">Audit Logs</h1>
              <p className="audit-logs-subtitle">Realtime USER, ADMIN, and SUPERADMIN activity stream.</p>
            </div>
          </div>
          <div className="audit-toolbar">
            <div className="audit-search">
              <Search size={14} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search actor, role, action, entity..."
              />
            </div>
            <CalendarDays size={15} color="rgba(180, 210, 255, 0.5)" />
            <FilterDropdown
              label="Date"
              value={dateRangeMode}
              onChange={(value) => {
                setDateRangeMode(value)
                if (value === 'ALL') {
                  setDateFrom('')
                  setDateTo('')
                }
              }}
              options={[
                { value: 'ALL', label: 'All Dates' },
                { value: 'CUSTOM', label: 'Custom Date' },
              ]}
            />
            {dateRangeMode === 'CUSTOM' && (
              <>
                <DatePickerField value={dateFrom} onChange={setDateFrom} label="Audit date from" />
                <DatePickerField value={dateTo} onChange={setDateTo} label="Audit date to" />
              </>
            )}
            <div className="audit-live-badge"><Radio size={13} />Live</div>
          </div>
        </div>

        <section className="audit-logs-table-card">
          {loading ? (
            <div className="audit-feedback">
              <Loader2 className="animate-spin mb-3 mx-auto text-blue-400" size={28} />
              <p>Loading audit logs...</p>
            </div>
          ) : error ? (
            <div className="audit-feedback error">{error}</div>
          ) : filteredAuditRows.length === 0 ? (
            <div className="audit-feedback">
              {dateRangeMode === 'CUSTOM'
                ? 'No audit records found for the selected date.'
                : 'No USER, ADMIN, or SUPERADMIN activity logged yet.'}
            </div>
          ) : (
            <div className="audit-logs-table-scroll">
              <table className="audit-logs-table">
                <thead>
                  <tr>
                    <th><button type="button" className="audit-sort-btn" onClick={() => handleSort('created_at')}>{sortLabel('created_at', 'Timestamp')}</button></th>
                    <th><button type="button" className="audit-sort-btn" onClick={() => handleSort('actor_email')}>{sortLabel('actor_email', 'Actor')}</button></th>
                    <th><button type="button" className="audit-sort-btn" onClick={() => handleSort('actor_role')}>{sortLabel('actor_role', 'Role')}</button></th>
                    <th><button type="button" className="audit-sort-btn" onClick={() => handleSort('action')}>{sortLabel('action', 'Action')}</button></th>
                    <th><button type="button" className="audit-sort-btn" onClick={() => handleSort('entity')}>{sortLabel('entity', 'Entity')}</button></th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditRows.map((row) => (
                    <tr key={row.id}>
                      <td>{formatTimestamp(row.created_at)}</td>
                      <td>{row.actor_email || row.actor_user_id}</td>
                      <td>
                        <span className={`audit-role-badge ${String(row.actor_role || '').toLowerCase()}`}>
                          {row.actor_role}
                        </span>
                      </td>
                      <td>{row.action}</td>
                      <td>
                        <span className="audit-entity">
                          {row.entity_type}{row.entity_id ? `: ${row.entity_id}` : ''}
                        </span>
                      </td>
                      <td className="audit-meta" title={JSON.stringify(row.metadata || {})}>
                        {JSON.stringify(row.metadata || {})}
                      </td>
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

export default AuditLogs
