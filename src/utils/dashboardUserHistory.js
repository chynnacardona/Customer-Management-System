export const USER_HISTORY_BASELINE_YEAR = 2010

const toUpper = (value) => String(value || '').toUpperCase()

export const getYearFromDate = (value) => {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.getFullYear()
}

export const getActivationYearsByUser = (auditLogs = []) => {
  const activationYears = new Map()

  for (const log of auditLogs || []) {
    const action = String(log?.action || '').toLowerCase()
    if (!action.includes('activated') || !action.includes('user')) continue

    const userId = log?.entity_id
    const year = getYearFromDate(log?.created_at)
    if (!userId || !year) continue

    const currentYear = activationYears.get(userId)
    if (!currentYear || year < currentYear) {
      activationYears.set(userId, year)
    }
  }

  return activationYears
}

export const isUserActiveByYear = (user, selectedYear, activationYearsByUser = new Map()) => {
  if (toUpper(user?.record_status) !== 'ACTIVE') return false

  const selectedYearNum = Number(selectedYear)
  if (!Number.isFinite(selectedYearNum)) return true

  const activationYear =
    activationYearsByUser.get(user?.userId) ||
    getYearFromDate(user?.created_at) ||
    USER_HISTORY_BASELINE_YEAR

  return activationYear <= selectedYearNum
}

export const buildHistoricalUserStats = ({
  users = [],
  auditLogs = [],
  selectedYear,
} = {}) => {
  const activationYearsByUser = getActivationYearsByUser(auditLogs)
  const historicalActiveUsers = (users || []).filter((user) =>
    isUserActiveByYear(user, selectedYear, activationYearsByUser)
  )

  return {
    activeStaff: historicalActiveUsers.filter((u) => toUpper(u.user_type) === 'USER').length,
    activeAdmins: historicalActiveUsers.filter((u) => toUpper(u.user_type) === 'ADMIN').length,
    activeUsersTotal: historicalActiveUsers.length,
  }
}
