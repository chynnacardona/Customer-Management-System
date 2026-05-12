export const prettifyEmailName = (email = '') => {
  const emailName = String(email)
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim()

  return emailName
    ? emailName.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'System User'
}

export const isPlaceholderName = (name = '') => {
  const normalized = String(name).trim().toLowerCase()
  return !normalized || normalized === 'admin user'
}

export const encodeStampPayload = (payload) => btoa(unescape(encodeURIComponent(JSON.stringify(payload))))

export const decodeStampPayload = (payload) => {
  if (!payload) return null

  try {
    return JSON.parse(decodeURIComponent(escape(atob(payload))))
  } catch {
    try {
      return JSON.parse(atob(payload))
    } catch {
      return null
    }
  }
}

export const buildActorSnapshot = ({ authUser, userRole }) => {
  const metadataName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name
  const databaseName = !isPlaceholderName(authUser?.full_name) ? authUser.full_name : ''
  const email = authUser?.email ?? 'admin@hope.com'

  return {
    name: databaseName || metadataName || prettifyEmailName(email),
    email,
    role: String(userRole || authUser?.user_type || 'USER').toUpperCase(),
  }
}

export const createCustomerStampEntry = ({
  actionType = 'U',
  actor,
  description,
  previousSnapshot = null,
}) => {
  const now = new Date()
  const monthDayString = `${now.getMonth() + 1}/${now.getDate()}`
  const timeString = now.toLocaleTimeString('en-GB', { hour12: false })
  const actorEmail = actor?.email || 'admin@hope.com'
  const actorRole = String(actor?.role || 'USER').toUpperCase()
  const userPrefix = actorEmail.split('@')[0].substring(0, 3)
  const snapshotPayload = previousSnapshot ? encodeStampPayload(previousSnapshot) : ''
  const actorPayload = encodeStampPayload(actor || {})

  return `${monthDayString}:${timeString}:${actionType}:${userPrefix}:${actorRole[0]}:${description}:${snapshotPayload}:${actorPayload}`
}

export const appendCustomerStampEntry = (currentStamp, entry) => {
  const existingHistoryEntries =
    currentStamp && currentStamp !== '-'
      ? String(currentStamp).split(';').filter(Boolean)
      : []

  return [entry, ...existingHistoryEntries].join(';')
}

export const resolveStampActor = ({ segments, actorData, matchedDatabaseUser }) => {
  const userCode = segments[5]
  const databaseUserName = !isPlaceholderName(matchedDatabaseUser?.full_name)
    ? matchedDatabaseUser.full_name
    : ''
  const actorName = !isPlaceholderName(actorData?.name) ? actorData.name : ''
  const actorEmail = actorData?.email || matchedDatabaseUser?.email || `${userCode}@hope.com`

  return {
    name: actorName || databaseUserName || prettifyEmailName(actorEmail),
    email: actorEmail,
    role: actorData?.role || (segments[6] === 'S' ? 'SUPERADMIN' : (segments[6] === 'A' ? 'ADMIN' : 'USER')),
  }
}
