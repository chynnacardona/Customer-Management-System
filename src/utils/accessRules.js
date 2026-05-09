export const DEFAULT_RIGHTS = {
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

export const REQUIRED_RIGHTS = Object.keys(DEFAULT_RIGHTS)

export const hasRight = (rights, rightId) => rights?.[rightId] === 1

export const canAddCustomer = (rights) => hasRight(rights, 'CUST_ADD')

export const canEditCustomer = (rights) => hasRight(rights, 'CUST_EDIT')

export const canDeleteCustomer = (rights) => hasRight(rights, 'CUST_DEL')

export const canViewAdmin = (rights) => hasRight(rights, 'ADM_USER')

export const canManageDeletedCustomers = (userType) =>
  userType === 'ADMIN' || userType === 'SUPERADMIN'

export const getRoleAccess = ({ rights = DEFAULT_RIGHTS, userType = 'USER' } = {}) => ({
  addCustomer: canAddCustomer(rights),
  editCustomer: canEditCustomer(rights),
  deleteCustomer: canDeleteCustomer(rights),
  viewAdmin: canViewAdmin(rights),
  manageDeletedCustomers: canManageDeletedCustomers(userType),
})
