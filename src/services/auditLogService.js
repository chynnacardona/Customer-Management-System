import { supabase } from '../supabase/supabaseClient'

const AUDITED_ROLES = new Set(['USER', 'ADMIN', 'SUPERADMIN'])

function isMissingAuditTableError(error) {
  return error?.code === 'PGRST205' || String(error?.message || '').toLowerCase().includes('schema cache')
}

function normalizeRole(role) {
  return String(role || '').toUpperCase()
}

async function getActorProfile() {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData?.user) return null

  const { data: profile, error: profileError } = await supabase
    .from('user')
    .select('userId, email, user_type, record_status')
    .eq('userId', authData.user.id)
    .maybeSingle()

  if (profileError || !profile) return null

  const actorRole = normalizeRole(profile.user_type)
  if (!AUDITED_ROLES.has(actorRole) || profile.record_status !== 'ACTIVE') return null

  return {
    userId: profile.userId || authData.user.id,
    email: profile.email || authData.user.email,
    role: actorRole,
  }
}

export async function logAuditActivity({ action, entityType, entityId = null, metadata = {} }) {
  const actor = await getActorProfile()
  if (!actor) return

  const { error } = await supabase
    .from('audit_logs')
    .insert({
      actor_user_id: actor.userId,
      actor_email: actor.email,
      actor_role: actor.role,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    })

  if (error) return
}

export async function getAuditLogs({ limit = 100, startIso = null, endIso = null } = {}) {
  let query = supabase
    .from('audit_logs')
    .select('id, actor_user_id, actor_email, actor_role, action, entity_type, entity_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (startIso) query = query.gte('created_at', startIso)
  if (endIso) query = query.lte('created_at', endIso)

  const { data, error } = await query

  if (error) {
    if (isMissingAuditTableError(error)) {
      throw new Error('Audit Logs table is not installed yet. Run migration 06_audit_logs.sql in Supabase, then refresh this page.')
    }
    throw error
  }
  return data || []
}

export function subscribeToAuditLogs(onInsert) {
  const channel = supabase
    .channel('audit-logs-feed')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'audit_logs' },
      (payload) => onInsert(payload.new)
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
