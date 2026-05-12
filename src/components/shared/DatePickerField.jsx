import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const formatValue = (date) => {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseValue = (value) => {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const formatDisplay = (value) => {
  const date = parseValue(value)
  if (!date) return 'dd/mm/yyyy'
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function DatePickerField({ value, onChange, label = 'Date' }) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseValue(value)
  const [viewDate, setViewDate] = useState(selectedDate || new Date())
  const rootRef = useRef(null)

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const start = new Date(year, month, 1 - firstOfMonth.getDay())

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start)
      day.setDate(start.getDate() + index)
      return day
    })
  }, [viewDate])

  const changeMonth = (amount) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  }

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const selectedValue = selectedDate ? formatValue(selectedDate) : ''

  return (
    <div className="date-picker-field" ref={rootRef}>
      <button
        type="button"
        className={`date-picker-trigger ${open ? 'open' : ''}`}
        onClick={() => {
          setViewDate(parseValue(value) || new Date())
          setOpen((current) => !current)
        }}
        aria-label={label}
      >
        <span>{formatDisplay(value)}</span>
        <CalendarDays size={14} />
      </button>

      {open && (
        <div className="date-picker-popover">
          <div className="date-picker-head">
            <button type="button" className="date-picker-nav" onClick={() => changeMonth(-1)} aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="date-picker-month" onClick={() => setViewDate(new Date())}>
              {monthLabel} <ChevronDown size={13} />
            </button>
            <button type="button" className="date-picker-nav" onClick={() => changeMonth(1)} aria-label="Next month">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="date-picker-weekdays">
            {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className="date-picker-grid">
            {calendarDays.map((day) => {
              const dayValue = formatValue(day)
              const isOutside = day.getMonth() !== viewDate.getMonth()
              const isSelected = dayValue === selectedValue
              const isToday = dayValue === formatValue(new Date())

              return (
                <button
                  type="button"
                  className={`date-picker-day ${isOutside ? 'outside' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  key={dayValue}
                  onClick={() => {
                    onChange(dayValue)
                    setOpen(false)
                  }}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          <div className="date-picker-footer">
            <button type="button" onClick={() => onChange('')}>Clear</button>
            <button type="button" onClick={() => {
              onChange(formatValue(new Date()))
              setOpen(false)
            }}>Today</button>
          </div>
        </div>
      )}

      <style>{`
        .date-picker-field {
          position: relative;
          flex: 0 0 148px;
        }

        .date-picker-trigger {
          width: 100%;
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          border-radius: 10px;
          border: 1px solid rgba(126, 184, 255, 0.16);
          background: rgba(13, 28, 64, 0.86);
          color: rgba(225, 238, 255, 0.92);
          padding: 0 11px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
          transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .date-picker-trigger svg {
          color: rgba(126, 184, 255, 0.58);
          flex-shrink: 0;
        }

        .date-picker-trigger:hover,
        .date-picker-trigger.open {
          border-color: rgba(56, 189, 248, 0.36);
          background: rgba(14, 32, 74, 0.94);
          box-shadow: 0 0 0 3px rgba(46, 134, 245, 0.12), inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .date-picker-popover {
          position: absolute;
          top: calc(100% + 7px);
          right: 0;
          z-index: 1400;
          width: 256px;
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(126, 184, 255, 0.18);
          background:
            linear-gradient(180deg, rgba(46, 134, 245, 0.08), transparent 34%),
            rgba(10, 18, 42, 0.98);
          box-shadow: 0 24px 54px rgba(0, 0, 0, 0.52), inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(18px) saturate(145%);
        }

        .date-picker-head {
          display: grid;
          grid-template-columns: 30px 1fr 30px;
          align-items: center;
          gap: 8px;
          margin-bottom: 13px;
        }

        .date-picker-nav,
        .date-picker-month,
        .date-picker-footer button,
        .date-picker-day {
          border: 0;
          background: transparent;
          font-family: inherit;
          cursor: pointer;
        }

        .date-picker-nav {
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          color: rgba(190, 215, 255, 0.72);
        }

        .date-picker-nav:hover {
          background: rgba(126, 184, 255, 0.1);
          color: rgba(245, 250, 255, 0.96);
        }

        .date-picker-month {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: rgba(245, 250, 255, 0.96);
          font-size: 13px;
          font-weight: 900;
        }

        .date-picker-weekdays,
        .date-picker-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
        }

        .date-picker-weekdays {
          margin-bottom: 7px;
        }

        .date-picker-weekdays span {
          color: rgba(180, 210, 255, 0.44);
          font-size: 10.5px;
          font-weight: 900;
          text-align: center;
        }

        .date-picker-day {
          height: 28px;
          border-radius: 8px;
          color: rgba(235, 245, 255, 0.9);
          font-size: 12px;
          font-weight: 800;
        }

        .date-picker-day:hover {
          background: rgba(126, 184, 255, 0.11);
          color: white;
        }

        .date-picker-day.outside {
          color: rgba(180, 210, 255, 0.3);
        }

        .date-picker-day.today {
          border: 1px solid rgba(56, 189, 248, 0.55);
          color: rgba(125, 211, 252, 0.98);
        }

        .date-picker-day.selected {
          background: rgba(96, 165, 250, 0.92);
          color: #061024;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.16);
        }

        .date-picker-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 12px;
        }

        .date-picker-footer button {
          color: rgba(125, 211, 252, 0.96);
          font-size: 12px;
          font-weight: 850;
          padding: 7px 8px;
          border-radius: 8px;
        }

        .date-picker-footer button:hover {
          background: rgba(56, 189, 248, 0.09);
        }
      `}</style>
    </div>
  )
}

export default DatePickerField
