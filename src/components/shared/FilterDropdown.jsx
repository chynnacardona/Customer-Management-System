import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

function FilterDropdown({ value, options, onChange, icon = null, label = 'Filter', className = '', disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const ref = useRef(null)
  const menuRef = useRef(null)
  const selected = options.find((option) => option.value === value) || options[0]

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (disabled) return
      const isButtonClick = ref.current?.contains(event.target)
      const isMenuClick = menuRef.current?.contains(event.target)
      if (!isButtonClick && !isMenuClick) setIsOpen(false)
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [disabled])

  useLayoutEffect(() => {
    if (!isOpen || !ref.current) return undefined

    const updateMenuPosition = () => {
      const rect = ref.current.getBoundingClientRect()
      const width = Math.max(rect.width, 178)
      const availableBelow = window.innerHeight - rect.bottom - 10
      const maxHeight = Math.max(140, Math.min(260, availableBelow))

      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 7,
        left: Math.max(8, rect.right - width),
        width,
        maxHeight,
      })
    }

    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [isOpen])

  const menu = isOpen && menuStyle ? (
    <div className="filter-dropdown-menu" role="listbox" aria-label={label} ref={menuRef} style={menuStyle}>
      {options.map((option) => (
        <button
          type="button"
          className={`filter-dropdown-option ${option.value === value ? 'selected' : ''}`}
          role="option"
          aria-selected={option.value === value}
          key={option.value}
        onClick={() => {
            if (disabled) return
            onChange(option.value)
            setIsOpen(false)
          }}
        >
          <span className="filter-dropdown-option-label">{option.label}</span>
          {option.value === value && <Check size={13} />}
        </button>
      ))}
    </div>
  ) : null

  return (
    <div className={`filter-dropdown ${isOpen ? 'is-open' : ''} ${className}`} ref={ref}>
      <button
        type="button"
        className="filter-dropdown-button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((current) => !current)
        }}
      >
        {icon && <span className="filter-dropdown-icon">{icon}</span>}
        <span className="filter-dropdown-text">{selected?.label || label}</span>
        <ChevronDown className={`filter-dropdown-chevron ${isOpen ? 'open' : ''}`} size={14} />
      </button>

      {menu && createPortal(menu, document.body)}

      <style>{`
        .filter-dropdown {
          position: relative;
          min-width: 148px;
          z-index: 1;
        }

        .filter-dropdown.is-open {
          z-index: 120;
        }

        .filter-dropdown-button {
          width: 100%;
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          border: 1px solid rgba(126, 184, 255, 0.14);
          border-radius: 10px;
          padding: 0 10px;
          background: rgba(126, 184, 255, 0.055);
          color: rgba(225, 238, 255, 0.9);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        }

        .filter-dropdown-button:hover,
        .filter-dropdown-button[aria-expanded="true"] {
          border-color: rgba(126, 184, 255, 0.28);
          background: rgba(126, 184, 255, 0.085);
          box-shadow: 0 0 0 3px rgba(46, 134, 245, 0.08);
        }

        .filter-dropdown-button:disabled {
          opacity: 0.48;
          cursor: wait;
          box-shadow: none;
        }

        .filter-dropdown-icon {
          display: inline-flex;
          align-items: center;
          color: rgba(147, 197, 253, 0.9);
          flex-shrink: 0;
        }

        .filter-dropdown-text {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .filter-dropdown-chevron {
          color: rgba(180, 210, 255, 0.52);
          flex-shrink: 0;
          transition: transform 0.18s ease;
        }

        .filter-dropdown-chevron.open {
          transform: rotate(180deg);
        }

        .filter-dropdown-menu {
          z-index: 1200;
          overflow-y: auto;
          padding: 6px;
          border-radius: 12px;
          border: 1px solid rgba(126, 184, 255, 0.18);
          background: rgba(7, 16, 36, 0.98);
          box-shadow: 0 18px 38px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255,255,255,0.05);
          backdrop-filter: blur(18px);
        }

        .filter-dropdown-option {
          width: 100%;
          min-height: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          border: 0;
          border-radius: 8px;
          padding: 0 9px;
          background: transparent;
          color: rgba(190, 215, 255, 0.72);
          font-size: 12px;
          font-weight: 750;
          text-align: left;
          cursor: pointer;
        }

        .filter-dropdown-option:hover,
        .filter-dropdown-option.selected {
          color: rgba(245, 250, 255, 0.96);
          background: rgba(126, 184, 255, 0.09);
        }

        .filter-dropdown-option svg {
          color: rgba(134, 239, 172, 0.95);
          flex-shrink: 0;
        }

        .filter-dropdown-option-label {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}

export default FilterDropdown
