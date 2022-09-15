
export interface IsEmptyFunction {
  <T>(value: T | null | undefined): value is null | undefined;
  <T>(value: T | `` | {} | [] | undefined): value is `` | {} | [] | undefined; // eslint-disable-line @typescript-eslint/ban-types
}

export const isEmpty = (value => {
  try {
    if (value instanceof Error)
      return false
    
    if (typeof value === `number` || typeof value === `boolean`) 
      return false

    if (typeof value === `string` && value === ``) 
      return true

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
    if (value instanceof Object) {
      // If (`toString` in value && typeof (<any>value).toString === `function`) {
      //   const stringify = (<any>value).toString()
      //   return stringify !== `[object Object]` && isEmpty(stringify
      // }
      
      if (Object.keys(value).length === 0) return true

      void 0
    }

    if (Array.isArray(value) && value.every(item => isEmpty(item))) 
      return true

    return false
  } catch {
    return true
  }
}) as IsEmptyFunction
