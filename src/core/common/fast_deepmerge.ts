
/**
 * FastDeepMerge - EXPERIMENTAL! until proofed compare with deepmerge-ts
 * @param x 
 * @param y 
 * @param max_stack 
 * @returns 
 */

import { Buffer } from 'buffer'

type MergeObjectResult<X, Y> =
  X extends undefined
    ? Y extends undefined
      ? undefined
      : X
    : Y extends undefined
      ? X
      : { [K in keyof (X & Y)]: (X & Y)[K] }

export type FastDeepMergeType = <X = undefined, Y = undefined, O extends { max_stack?: number } = Record<string, any>>(x?: X, y?: Y, options?: O) => MergeObjectResult<X, Y>

const safePropertyPollution = (mergeResult, key, propertyResult) => {
  if (key === `__proto__`) {
    Object.defineProperty(mergeResult, key, {
      value: propertyResult,
      configurable: true,
      enumerable: true,
      writable: true,
    })
  } else {
    mergeResult[key] = propertyResult
  }
}

const isPrimitive = value =>
  value !== undefined && (
    value === null
    || (typeof value !== `object` && typeof value !== `function`)
    || value instanceof Date
    || value instanceof RegExp
    || value instanceof Buffer
  )
  
const { isArray } = Array

const isValid = Symbol.for(`IS_VALID`)

const valueValidation = (x, y, options) => {
  const max_stack = options?.max_stack ?? 10
  if (max_stack < 1) 
    return y ?? x

  if (isPrimitive(y)) 
    return y

  if (x === undefined || x === null) 
    return y ?? x

  if (y === undefined || y === null) 
    return x ?? y

  if (typeof x !== typeof y) 
    return y ?? x
  
  if (isArray(y) && !isArray(x)) 
    return y ?? x

  if (!isArray(y) && isArray(x)) 
    return y ?? x
  
  if (typeof x !== `object` || typeof y !== `object`) 
    return y ?? x
  
  return isValid
}

const mergeArray = (x, y) => [...x, ...y]
const mergeMap = (x, y) => new Map([...x, ...y])
const mergeSet = (x, y) => new Set([...x, ...y])

const mergeUnknown = (x, y, options) => {
  if (isArray(x) && isArray(y)) 
    return y ?? x

  if (x instanceof Map && y instanceof Map) 
    return mergeMap(x, y)
  
  if (x instanceof Set && y instanceof Set) 
    return mergeSet(x, y)
  
  const max_stack = options?.max_stack ?? 10
  const validationResult = valueValidation(x, y, options)

  if (validationResult !== isValid) 
    return validationResult
  
  x && (x = ({ ...x })) // Prevent mutation
  y && (y = ({ ...y })) // Prevent mutation
  
  if (typeof x === typeof y && typeof x === `object`) {
    const mergeResult = {}
    for (const k in x) {
      if (Object.prototype.hasOwnProperty.call(x, k)) {
        const result = mergeUnknown(x[k], y[k], { max_stack: max_stack - 1 })
        safePropertyPollution(mergeResult, k, result)
      }
    }
  
    for (const k in y) {
      if (Object.prototype.hasOwnProperty.call(y, k) && y[k] !== undefined) {
        const result = mergeUnknown(x[k], y[k], { max_stack: max_stack - 1 })
        safePropertyPollution(mergeResult, k, result)
      }
    }

    return mergeResult
  }

  return y ?? x
}

export const fastDeepMerge: FastDeepMergeType = (x, y, options) => {
  if (isArray(x) && isArray(y)) 
    return mergeArray(x, y)
  
  return mergeUnknown(x, y, options)
}
