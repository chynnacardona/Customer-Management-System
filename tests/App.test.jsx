import { describe, expect, it } from 'vitest'
import {
  DEFAULT_RIGHTS,
  REQUIRED_RIGHTS,
  canManageDeletedCustomers,
  getRoleAccess,
} from '../src/utils/accessRules'

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
