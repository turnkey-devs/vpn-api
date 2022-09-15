import { Buffer } from 'buffer'
import { serializeError } from './serialize-error.utils'

export const isEmpty = <T>(value: T | undefined | null): value is undefined | null => {
  if (typeof value === `number` || typeof value === `boolean`) 
    return false

  if (typeof value === `undefined` || value === null) 
    return true

  if (value instanceof Date) 
    return false
  
  // Handle Object.create(null)
  if (typeof value === `object` && Object.getPrototypeOf(value) === null) 
    return true
  
  // Handle function
  if (typeof value === `function`) 
    return false
  
  // Handle {} and []
  if (value instanceof Object && Object.keys(value).length === 0) 
    return true

  if (Array.isArray(value) && value.every(item => isEmpty(item))) 
    return true

  if (<any>value === ``) 
    return true

  return false
}

const hasProperty = Object.prototype.hasOwnProperty

function throwsMessage(error) {
  return `[Throws: ${ (error ? error.message : `?`) }]`
}

function safeGetValueFromPropertyOnObject(object, property) {
  if (hasProperty.call(object, property)) {
    try {
      return object[property]
    } catch (error) {
      return throwsMessage(error)
    }
  }

  return object[property]
}

function ensureProperties(object) {
  const seen: any[] = [] // Store references to objects we have seen before

  function visit(object_) {
    if (object_ === null || typeof object_ !== `object`) {
      if (typeof object_ === `bigint`) {
        // Maximum number is around 2^53-1, so it may be failed
        try {
          return Number(object_)
        } catch {
          return String(object_)
        }
      }

      return object_
    }

    if (seen.includes(object_)) 
      return `[Circular]`

    seen.push(object_)

    if (typeof object_.toJSON === `function`) {
      try {
        const fResult = visit(object_.toJSON())
        seen.pop()
        return fResult
      } catch (error) {
        return throwsMessage(error)
      }
    }
		
    if (object_ instanceof Error) {
      try {
        const errorResult = visit(serializeError(object_))
        seen.pop()
        return errorResult
      } catch (error) {
        return throwsMessage(error)
      }
    }

    if (Array.isArray(object_)) {
      const aResult = object_.map(visit)
      seen.pop()
      return aResult
    }

    const result = Object.keys(object_)
      .reduce((result, property) => {
        // Prevent faulty defined getter properties
        result[property] = visit(safeGetValueFromPropertyOnObject(object_, property))
        return result
      }, {})
    
    seen.pop()
    return result
  }

  return visit(object)
}

const doStringify = function (data, replacer, space) {
  return JSON.stringify(ensureProperties(data), replacer, space)
}

// END OF CREDITS
export const safeJsonStringify = <T = unknown>(possiblyObject: T, indent = 0): string => {
  try {
    if (indent < 0) 
      throw new Error(`indent cannot be negative bro...`)

    if (Buffer.isBuffer(possiblyObject)) 
      return `<<BUFFER>>`

    if (possiblyObject) 
      return doStringify(possiblyObject, void 0, indent)

    return JSON.stringify(possiblyObject)
  } catch {
    return JSON.stringify(String(possiblyObject))
  }
}

export const safeJsonParse = <T, R>(string_: T): (T extends {
  [K in keyof T]?: T[K]
} ? T : R) | undefined => {
  try {
    return JSON.parse(safeJsonStringify(string_))
  } catch {
    return void 0
  }
}
