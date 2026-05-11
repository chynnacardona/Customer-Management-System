import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Clock3,
  Download,
  FileChartColumn,
  History,
  X,
} from 'lucide-react'
import FilterDropdown from './FilterDropdown'
import { customerService } from '../../services/customerService'
import { getProducts, getSales } from '../../services/salesProductApi'
import { getCustomerSalesSummary, getProductRevenue, getTopCustomers } from '../../services/reportsApi'
import { setPreferredCurrency } from '../../utils/currency'
import './ProfileSettingsModal.css'

const defaultSettings = {
  timezone: 'Asia/Manila',
  currency: 'PHP',
  dateFormat: 'MMM dd, yyyy',
  twoFactor: false,
  exportDataset: 'CUSTOMERS',
}

function ProfileAvatar({ avatarUrl, initials, className = '' }) {
  return (
    <div className={`profile-settings-avatar ${className}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" referrerPolicy="no-referrer" />
      ) : (
        initials
      )}
    </div>
  )
}

function ProfileSettingsModal({ user, storageKey, savedProfile, onClose, onLogout, onSaveProfile }) {
  const [activeTab, setActiveTab] = useState('PROFILE')
  const [formName, setFormName] = useState(savedProfile?.name || user?.name || 'User')
  const [avatarPreview, setAvatarPreview] = useState(savedProfile?.avatarUrl || user?.avatarUrl || '')
  const [settings, setSettings] = useState(() => ({ ...defaultSettings, ...(savedProfile?.settings || {}) }))
  const [statusMessage, setStatusMessage] = useState('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showExportPicker, setShowExportPicker] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const fileInputRef = useRef(null)

  const initials = useMemo(() => {
    return (formName || user?.email || 'U')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'U'
  }, [formName, user?.email])
  const lastSignIn = user?.lastSignInAt
    ? new Intl.DateTimeFormat('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: settings.timezone,
    }).format(new Date(user.lastSignInAt))
    : 'Not available'

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }))
    setStatusMessage('')
  }

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setAvatarPreview(String(reader.result || ''))
      setStatusMessage('')
    }
    reader.readAsDataURL(file)
  }

  const downloadCsv = (filename, rows) => {
    const safeRows = rows.length > 0 ? rows : [{ status: 'No records found' }]
    const headers = [...new Set(safeRows.flatMap((row) => Object.keys(row || {})))]
    const lines = [
      headers,
      ...safeRows.map((row) => headers.map((header) => {
        const value = row?.[header]
        return typeof value === 'object' && value !== null ? JSON.stringify(value) : value
      })),
    ]
    const csv = lines.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const exporters = {
        CUSTOMERS: { name: 'customers.csv', load: customerService.getCustomers },
        SALES: { name: 'sales.csv', load: getSales },
        PRODUCTS: { name: 'products.csv', load: getProducts },
        CUSTOMER_SUMMARY: { name: 'customer-sales-summary.csv', load: getCustomerSalesSummary },
        TOP_CUSTOMERS: { name: 'top-customers.csv', load: () => getTopCustomers(10) },
        PRODUCT_REVENUE: { name: 'product-revenue.csv', load: getProductRevenue },
      }
      const exporter = exporters[settings.exportDataset]
      const rows = await exporter.load()
      downloadCsv(exporter.name, rows || [])
      setStatusMessage('Export ready')
    } catch (error) {
      setStatusMessage(error.message || 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handleSave = () => {
    const payload = { name: formName, avatarUrl: avatarPreview, settings }
    window.localStorage.setItem(storageKey, JSON.stringify(payload))
    setPreferredCurrency(settings.currency)
    if (user?.email) {
      window.localStorage.setItem(`hope-cms-2fa-${user.email.toLowerCase()}`, settings.twoFactor ? 'enabled' : 'disabled')
    }
    onSaveProfile(payload)
    setStatusMessage('Changes saved')
  }

  return (
    <div className="profile-settings-overlay" role="dialog" aria-modal="true" aria-labelledby="profile-settings-title" onClick={onClose}>
      <div className="profile-settings-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="profile-settings-close floating" onClick={onClose} aria-label="Close profile settings">
          <X size={16} />
        </button>

        <div className="profile-settings-cover" />
        <div className="profile-settings-header">
          <div className="profile-settings-user">
            <ProfileAvatar avatarUrl={avatarPreview} initials={initials} />
            <div>
              <h2 id="profile-settings-title">{formName}</h2>
              <p>@{(user?.email || 'user').split('@')[0]} - {user?.role || 'USER'}</p>
            </div>
          </div>
          {activeTab === 'PROFILE' && <div className="profile-settings-header-actions">
            <button type="button" className="profile-settings-action danger" onClick={() => setShowLogoutConfirm(true)}>Log out</button>
          </div>}
        </div>

        <div className="profile-settings-tabs" role="tablist" aria-label="Profile sections">
          {[
            { id: 'PROFILE', label: 'Profile' },
            { id: 'SETTINGS', label: 'Settings' },
            { id: 'FEATURES', label: 'Others' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`profile-settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'PROFILE' && (
          <section className="profile-settings-panel">
            <div className="profile-row">
              <span>Profile Photo</span>
              <div className="profile-inline-actions">
                <input ref={fileInputRef} type="file" accept="image/*" className="profile-file-input" onChange={handleAvatarUpload} />
                <button type="button" className="profile-settings-action ghost" onClick={() => fileInputRef.current?.click()}>Upload</button>
                <button type="button" className="profile-settings-link" onClick={() => setAvatarPreview('')}>Remove</button>
              </div>
            </div>
            <div className="profile-row">
              <span>Name</span>
              <input className="profile-text-input" value={formName} onChange={(event) => setFormName(event.target.value)} />
            </div>
            <div className="profile-row">
              <span>Email Address</span>
              <strong>{user?.email || 'Not available'}</strong>
            </div>
            <div className="profile-row">
              <span>Role</span>
              <strong>{user?.role || 'USER'}</strong>
            </div>
          </section>
        )}

        {activeTab === 'SETTINGS' && (
          <section className="profile-settings-panel">
            <div className="profile-settings-control-row">
              <label>Timezone</label>
              <FilterDropdown label="Timezone" value={settings.timezone} onChange={(value) => updateSetting('timezone', value)} options={[
                { value: 'Asia/Manila', label: 'Asia/Manila' },
                { value: 'UTC', label: 'UTC' },
              ]} />
            </div>
            <div className="profile-settings-control-row">
              <label>Currency</label>
              <FilterDropdown label="Currency" value={settings.currency} onChange={(value) => updateSetting('currency', value)} options={[
                { value: 'PHP', label: 'PHP' },
                { value: 'USD', label: 'USD' },
              ]} />
            </div>
            <div className="profile-settings-control-row">
              <label>Date Format</label>
              <FilterDropdown label="Date Format" value={settings.dateFormat} onChange={(value) => updateSetting('dateFormat', value)} options={[
                { value: 'MMM dd, yyyy', label: 'MMM dd, yyyy' },
                { value: 'dd/MM/yyyy', label: 'dd/MM/yyyy' },
              ]} />
            </div>
          </section>
        )}

        {activeTab === 'FEATURES' && (
          <section className="profile-settings-panel">
            <div className="profile-feature-item"><History size={16} /><span>Last sign-in: {lastSignIn}</span></div>
            <div className="profile-feature-item">
              <FileChartColumn size={16} />
              <div className="profile-feature-stack">
                <button type="button" className="profile-settings-action ghost" onClick={() => setShowExportPicker((current) => !current)}>
                  Choose export data
                </button>
                {showExportPicker && (
                  <div className="profile-export-picker">
                    <FilterDropdown label="Export Data" value={settings.exportDataset} onChange={(value) => updateSetting('exportDataset', value)} options={[
                      { value: 'CUSTOMERS', label: 'Customers' },
                      { value: 'SALES', label: 'Sales' },
                      { value: 'PRODUCTS', label: 'Products' },
                      { value: 'CUSTOMER_SUMMARY', label: 'Customer Sales Summary' },
                      { value: 'TOP_CUSTOMERS', label: 'Top Customers' },
                      { value: 'PRODUCT_REVENUE', label: 'Product Revenue' },
                    ]} />
                    <button type="button" className="profile-settings-action primary" onClick={handleExport} disabled={isExporting}>{isExporting ? 'Exporting...' : 'Export CSV'}</button>
                  </div>
                )}
              </div>
            </div>
            <div className="profile-feature-item"><Download size={16} /><span>CSV exports use the selected data group.</span></div>
          </section>
        )}

        <div className="profile-settings-actions">
          {statusMessage && <span className="profile-save-status"><Check size={14} />{statusMessage}</span>}
          <button type="button" className="profile-settings-action ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="profile-settings-action primary" onClick={handleSave}>Save changes</button>
        </div>

        {showLogoutConfirm && (
          <div className="profile-confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirm log out">
            <div className="profile-confirm-dialog">
              <h3>Log out?</h3>
              <p>Are you sure you want to log out of this account?</p>
              <div className="profile-confirm-actions">
                <button type="button" className="profile-settings-action ghost" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                <button type="button" className="profile-settings-action danger" onClick={() => {
                  onLogout()
                  setShowLogoutConfirm(false)
                }}>Log out</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileSettingsModal
