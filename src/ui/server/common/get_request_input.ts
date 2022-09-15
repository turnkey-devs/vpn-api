import { isEmpty } from "@server/core/common/is_empty"
import { DeepObjectPlainMerge } from "@server/gateway/http_client/common/deep_object_merge"

export const getRequestQuery = <R extends Record<string, string | number>>(
  request: {
    query?: Record<string, any>;
  // Body?: Record<string, unknown>;
  // params?: Record<string, string>;
  }): R => {
  const { query } = request
  if (isEmpty(query)) 
    return {} as R

  return Object.keys(query).reduce<Record<string, string | number | undefined>>((accumulator, key) => {
    const value = !isEmpty(query[key]) ? query[key] : void 0
    if (typeof value === `number`) 
      accumulator[key] = Number(value)
    else if (typeof value === `string`) 
      accumulator[key] = String(value)
    
    // Lastly put the value if not undefined
    if (typeof value !== `undefined`) 
      accumulator[key] = value
    
    return accumulator
  }
  , {}) as R
}

export const getRequestParams = <R extends Record<string, string | number>>(
  request: {
  // Query?: Record<string, any>;
  // body?: Record<string, unknown>;
    params?: Record<string, string>;
  }): R => {
  const { params } = request
  if (isEmpty(params)) 
    return {} as R

  return Object.keys(params).reduce<Record<string, string | number | undefined>>((accumulator, key) => {
    const value = !isEmpty(params[key]) ? params[key] : void 0
    if (typeof value === `number`) 
      accumulator[key] = Number(value)
    else if (typeof value === `string`) 
      accumulator[key] = String(value)
    
    // Lastly put the value if not undefined
    if (typeof value !== `undefined`) 
      accumulator[key] = value
    
    return accumulator
  }
  , {}) as R
}

export const getRequestBody = <R extends Record<string, any>>(
  request: {
  // Query?: Record<string, any>;
    body?: Record<string, unknown>;
    // Params?: Record<string, string>;
  },
): R => {
  const { body } = request
  if (isEmpty(body)) 
    return {} as R

  return Object.keys(body).reduce<any>((accumulator, key) => {
    const value = body[key]
    if (!isEmpty(value)) {
      if (typeof value === `number`) 
        accumulator[key as keyof R] = Number(value) as any
      else if (typeof value === `string`) 
        accumulator[key as keyof R] = String(value) as any
      
      // Convert ID to string. ignore numbers
      if (typeof value === `string` && value !== ``) {
        // Trim the value
        const stringValue = value.trim()

        let startWith0 = false
        let isValidID = false
        let isNumerable = false
        // Check if stringVal has 0 on the first place
        if (stringValue.length > 0 && stringValue.startsWith(`0`)) 
          startWith0 = true
      
        // Check is it valid ID Number
        if (stringValue.length > 0) {
          const exp = /^[a-zA-Z\d]{8,}$/
          isValidID = exp.test(stringValue)
        }
        
        isNumerable = !(isValidID || startWith0)
        
        if (isNumerable) {
          const numbered = Number(value)
          accumulator[key as keyof R] = !Number.isNaN(numbered) ? numbered as any : value as any
        }
      }
      // End of convert ID to string. ignore numbers
    }
    
    // Lastly put the value if not undefined
    if (typeof value !== `undefined`) 
      accumulator[key as keyof R] = value as any
    
    return accumulator
  }
  , {})
}

/**
 * @description merge query > body > param into one object
 * @param req 
 * @returns 
 */
export const getRequestData = <R extends Record<string, any>>(
  request: {
    query?: Record<string, any>;
    body?: Record<string, unknown>;
    params?: Record<string, string>;
  },
): R => {
  try {
    let data: R = Object.assign({})
    const { body, params, query } = request
        
    body && (data = DeepObjectPlainMerge({ ...data }, getRequestBody<R>({ body })) as R)
    
    query && (data = DeepObjectPlainMerge({ ...data }, getRequestQuery<R>({ query })) as R)
    
    params && (data = DeepObjectPlainMerge({ ...data }, getRequestParams<R>({ params })) as R)
    
    return data
  } catch (error) {
    throw error
  }
}
