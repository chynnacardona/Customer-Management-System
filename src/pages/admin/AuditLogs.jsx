import { useEffect, useState } from 'react'
import { ClipboardList, Loader2, Radio } from 'lucide-react'
import { getAuditLogs, subscribeToAuditLogs } from '../../services/auditLogService'

function AuditLogs() {
  const [auditRows, setAuditRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    let unsubscribe = () => {}

    const loadLogs = async () => {
      try {
        setLoading(true)
        setError('')
        const rows = await getAuditLogs()
        if (!mounted) return
        setAuditRows(rows)
        unsubscribe = subscribeToAuditLogs((newLog) => {
          setAuditRows((current) => [newLog, ...current].slice(0, 100))
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
  }, [])

  const formatTimestamp = (value) => {
    if (!value) return '-'
    return new Intl.DateTimeFormat('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date(value))
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
          <div className="audit-live-badge"><Radio size={13} />Live</div>
        </div>

        <section className="audit-logs-table-card">
          {loading ? (
            <div className="audit-feedback">
              <Loader2 className="animate-spin mb-3 mx-auto text-blue-400" size={28} />
              <p>Loading audit logs...</p>
            </div>
          ) : error ? (
            <div className="audit-feedback error">{error}</div>
          ) : auditRows.length === 0 ? (
            <div className="audit-feedback">No USER, ADMIN, or SUPERADMIN activity logged yet.</div>
          ) : (
            <div className="audit-logs-table-scroll">
              <table className="audit-logs-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditRows.map((row) => (
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
