import { useSyncExternalStore } from 'react'

const CURRENCY_STORAGE_KEY = 'hope-cms-currency'
const CURRENCY_CHANGE_EVENT = 'hope-cms-currency-change'
const PHP_PER_USD = 58

export const getPreferredCurrency = () => {
  try {
    return window.localStorage.getItem(CURRENCY_STORAGE_KEY) || 'PHP'
  } catch {
    return 'PHP'
  }
}

export const setPreferredCurrency = (currency) => {
  try {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency)
    window.dispatchEvent(new CustomEvent(CURRENCY_CHANGE_EVENT, { detail: currency }))
  } catch {
    // Local storage can fail in private contexts; callers still keep local UI state.
  }
}

export const convertCurrencyValue = (value, currency = getPreferredCurrency()) => {
  const amount = Number(value || 0)
  return currency === 'USD' ? amount / PHP_PER_USD : amount
}

export const formatCurrencyValue = (value, currency = getPreferredCurrency()) => {
  const locale = currency === 'USD' ? 'en-US' : 'en-PH'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(convertCurrencyValue(value, currency))
}

const subscribeCurrency = (callback) => {
  window.addEventListener(CURRENCY_CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CURRENCY_CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export const useCurrencyFormatter = () => {
  const currency = useSyncExternalStore(subscribeCurrency, getPreferredCurrency, () => 'PHP')

  return {
    currency,
    formatCurrency: (value) => formatCurrencyValue(value, currency),
  }
}
