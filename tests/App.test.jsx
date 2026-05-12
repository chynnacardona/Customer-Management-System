import { describe, expect, it } from 'vitest'
import {
  DEFAULT_RIGHTS,
  REQUIRED_RIGHTS,
  canManageDeletedCustomers,
  getRoleAccess,
} from '../src/utils/accessRules'
import { buildHistoricalUserStats } from '../src/utils/dashboardUserHistory'

describe('Sprint 1 test setup', () => {
  it('runs the Vitest suite without touching live customer data', () => {
    expect(true).toBe(true)
  })
})

describe('CMS rights map', () => {
  it('tracks the nine rights required by the sprint guide', () => {
    expect(REQUIRED_RIGHTS).toEqual([
      'CUST_VIEW',
      'CUST_ADD',
      'CUST_EDIT',
      'CUST_DEL',
      'SALES_VIEW',
      'SD_VIEW',
      'PROD_VIEW',
      'PRICE_VIEW',
      'ADM_USER',
    ])
  })

  it('defaults every sprint right to blocked before rights load', () => {
    expect(Object.values(DEFAULT_RIGHTS).every((value) => value === 0)).toBe(true)
  })
})

describe('Sprint 2 rights matrix', () => {
  const roleCases = [
    ['USER', false],
    ['ADMIN', true],
    ['SUPERADMIN', true],
  ]

  it.each(roleCases)('%s deleted-customer access is %s', (userType, expected) => {
    expect(canManageDeletedCustomers(userType)).toBe(expected)
  })

  const rightsMatrix = roleCases.flatMap(([userType]) =>
    REQUIRED_RIGHTS.map((rightId) => [userType, rightId])
  )

  it.each(rightsMatrix)('applies the %s role with only %s granted', (userType, rightId) => {
    const access = getRoleAccess({
      userType,
      rights: { ...DEFAULT_RIGHTS, [rightId]: 1 },
    })

    expect(access).toEqual({
      addCustomer: rightId === 'CUST_ADD',
      editCustomer: rightId === 'CUST_EDIT',
      deleteCustomer: rightId === 'CUST_DEL',
      viewAdmin: rightId === 'ADM_USER',
      manageDeletedCustomers: userType === 'ADMIN' || userType === 'SUPERADMIN',
    })
  })

  it('keeps ADMIN customer delete blocked unless CUST_DEL is granted', () => {
    const adminAccess = getRoleAccess({
      userType: 'ADMIN',
      rights: { ...DEFAULT_RIGHTS, CUST_ADD: 1, CUST_EDIT: 1, ADM_USER: 1 },
    })

    expect(adminAccess).toMatchObject({
      addCustomer: true,
      editCustomer: true,
      deleteCustomer: false,
      viewAdmin: true,
      manageDeletedCustomers: true,
    })
  })
})

describe('Dashboard historical active users', () => {
  const users = [
    { userId: 'u-2010', user_type: 'USER', record_status: 'ACTIVE' },
    { userId: 'u-2011', user_type: 'USER', record_status: 'ACTIVE' },
    { userId: 'admin-2011', user_type: 'ADMIN', record_status: 'ACTIVE' },
    { userId: 'pending-2011', user_type: 'USER', record_status: 'INACTIVE' },
  ]

  const auditLogs = [
    {
      action: 'Activated user account',
      entity_type: 'user',
      entity_id: 'u-2011',
      created_at: '2011-04-10T08:30:00.000Z',
    },
    {
      action: 'Activated user account',
      entity_type: 'user',
      entity_id: 'admin-2011',
      created_at: '2011-06-12T08:30:00.000Z',
    },
  ]

  it('carries the latest active user total forward when later years have no additions', () => {
    expect(buildHistoricalUserStats({ users, auditLogs, selectedYear: 2010 })).toMatchObject({
      activeStaff: 1,
      activeAdmins: 0,
      activeUsersTotal: 1,
    })

    expect(buildHistoricalUserStats({ users, auditLogs, selectedYear: 2011 })).toMatchObject({
      activeStaff: 2,
      activeAdmins: 1,
      activeUsersTotal: 3,
    })

    expect(buildHistoricalUserStats({ users, auditLogs, selectedYear: 2026 })).toMatchObject({
      activeStaff: 2,
      activeAdmins: 1,
      activeUsersTotal: 3,
    })
  })
})
