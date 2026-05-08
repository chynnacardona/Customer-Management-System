import { describe, expect, it } from 'vitest'

const defaultRights = {
  CUST_VIEW: 0,
  CUST_ADD: 0,
  CUST_EDIT: 0,
  CUST_DEL: 0,
  SALES_VIEW: 0,
  SD_VIEW: 0,
  PROD_VIEW: 0,
  PRICE_VIEW: 0,
  ADM_USER: 0,
}

describe('User rights defaults', () => {
  it('tracks the nine CMS rights required by the sprint guide', () => {
    expect(Object.keys(defaultRights)).toEqual([
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
})
