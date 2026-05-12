const MS_PER_MINUTE = 60 * 1000

const toDateParts = (value) => {
  if (!value) return null

  const [year, month, day] = String(value).split('-').map(Number)
  if (!year || !month || !day) return null

  return { year, month, day }
}

export const getLocalDayIsoRange = (value) => {
  const parts = toDateParts(value)
  if (!parts) return { startIso: null, endIso: null }

  const start = new Date(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0)
  const end = new Date(parts.year, parts.month - 1, parts.day, 23, 59, 59, 999)

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

export const getLocalDateKey = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * MS_PER_MINUTE)
  return localTime.toISOString().slice(0, 10)
}
