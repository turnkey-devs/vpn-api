import DineroFactory from "dinero.js"

export const getCurrencyAmountStr = (amount: number, currency: 'USD' | 'IDR'): string => {
  try {
    if (typeof amount !== `number`)
      throw new TypeError(`amount is not number!`)
    const precision = amount.toFixed(3)
    const removedDot = Number.parseInt(String(precision).replace(`.`, ``)) // eslint-disable-line radix
    return DineroFactory({ amount: removedDot, currency, precision: 3 }).toFormat(`$0,0.00`)        
  } catch (error) {
    console.error(error.message)
    return `format error: ${ error.message }`
  }
}
