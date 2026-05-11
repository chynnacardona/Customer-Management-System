import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { logAuditActivity } from '../../services/auditLogService'

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/customers': 'Customers',
  '/sales': 'Sales',
  '/products': 'Products',
  '/reports/customer-sales-summary': 'Customer Sales Summary',
  '/reports/top-customers': 'Top Customers',
  '/reports/product-revenue': 'Product Revenue',
  '/admin': 'Admin',
  '/deleted-customers': 'Deleted Customers',
}

function getRouteLabel(pathname) {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]
  if (pathname.startsWith('/customers/')) return 'Customer Detail'
  return pathname.replace('/', '') || 'App'
}

function ActivityAuditTracker() {
  const location = useLocation()
  const { user } = useAuth()
  const lastTrackedPath = useRef('')

  useEffect(() => {
    if (!user) return

    const path = `${location.pathname}${location.search}`
    if (lastTrackedPath.current === path) return
    lastTrackedPath.current = path

    logAuditActivity({
      action: `Viewed ${getRouteLabel(location.pathname)}`,
      entityType: 'route',
      entityId: location.pathname,
      metadata: { path },
    })
  }, [location.pathname, location.search, user])

  return null
}

export default ActivityAuditTracker
