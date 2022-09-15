
import { isEmpty } from './is_empty'
/** --- START --- **/
/** --- TYPING UTILS --- **/

export type ExcludeMethod<T> = Pick<T, {
  [K in keyof T]: T[K] extends (...arguments_: Array<(infer A)>) => unknown ? never : K
}[keyof T]>

export type ObjectType<O> = {
  [K in keyof O]?: O[K]
}

export type DeepPartial<T> = T extends {
  [K in keyof T]?: unknown
} ? {
    [P in keyof T]?: DeepPartial<T[P]>;
  } : T

export type DeepRequired<T> = T extends {
  [K in keyof T]: unknown
} ? {
    [P in keyof T]: Exclude<DeepRequired<T[P]>, undefined>;
  } : Exclude<T, undefined>

export type Collection<T> = ArrayLike<T>

export type Many<T> = T | readonly T[]

export const sleep = async (ms = 1000) => new Promise(resolve => {
  setTimeout(resolve, ms) 
})

/** --- END --- **/

/** --- START --- **/
/** --- ARRAY LIKE UTILS --- **/

/**
 * maybeSameAsString. comparing 2 variables that somehow has the same result when converted to String. Excluding literal Object, null, undefined
 * @param valA 
 * @param valB 
 * @returns 
 */
const maybeSameAsString = (valueA: unknown, valueB: unknown) => {
  try {
    return !isEmpty(valueA) && !isEmpty(valueB)
    && String(valueA) === String(valueB)
    && ![`object`, `null`, `undefined`].includes(String(valueA))
    && ![`object`, `null`, `undefined`].includes(String(valueB))
  } catch (error) {
    console.warn({ error })
    return false
  }
}

export const findAndReplace = <T, R>(
  array: Array<T | R>,
  filter: DeepPartial<T | R>,
  replace: (
    matched: T | R | undefined,
    index: number,
    array_: Array<T | R>,
    filterFullfil: boolean
  ) => R,
): T | R | undefined => {
  const immutable: Array<T | R> = Object.assign([], array)
  find(immutable, filter, (a, index, c, pass) => {
    if (pass && typeof replace === `function`) 
      immutable.splice(index, 1, replace(a, index, c, pass))

    return pass
  })
  return find(immutable, filter)
}

export const findManyAndReplace = <T, R>(
  array: Array<T | R>,
  filter: DeepPartial<T | R>,
  replace: (
    matched: T | R | undefined,
    index: number,
    array_: Array<T | R>,
    filterFullfil: boolean
  ) => R,
): Collection<T | R | undefined> => {
  const immutable: Array<T | R> = Object.assign([], array)
  findMany(immutable, filter, (a, index, c, pass) => {
    if (pass && typeof replace === `function`) 
      immutable.splice(index, 1, replace(a, index, c, pass))

    return pass
  })
  return findMany(immutable, filter)
}

export const find = <T>(col: Collection<T> | undefined, filter?: DeepPartial<T>, customCondition?: (element: T, index: number, _: T[], filterFullfil: boolean) => boolean): T | undefined => {
  if ((isEmpty(filter) && !customCondition) || isEmpty(col))
    return void 0
  
  return Array.isArray(col)
    ? col.find(
      (element, index) => {
        const fullfil = (filterKey: string) => !isEmpty(filter)
          && (element[filterKey as keyof T] === filter[filterKey as keyof T]
          || maybeSameAsString(element[filterKey as keyof T], filter[filterKey as keyof T])
          )
        const isFulfilled = (!isEmpty(filter) && Object.keys(filter).every(fullfil))
        return typeof customCondition === `function` && !isEmpty(filter)
          ? ((isFulfilled) && customCondition(element, index, col, isFulfilled))
          : (typeof customCondition === `function`
            ? customCondition(element, index, col, isFulfilled)
            : (isFulfilled))
      },
    )
    : void 0
}

export const findMany = <T>(col: Collection<T> | undefined, filter?: DeepPartial<T>, customCondition?: (element: T, index: number, _: T[], filterFullfil: boolean) => boolean): T[] => {
  if ((isEmpty(filter) && !customCondition) || isEmpty(col)) 
    return []
  
  return Array.isArray(col) 
    ? col.filter(
      (element, index) => {
        const fullfil = (filterKey: string) => !isEmpty(filter)
          && (element[filterKey as keyof T] === filter[filterKey as keyof T]
          || maybeSameAsString(element[filterKey as keyof T], filter[filterKey as keyof T])
          )
        const isFulfilled = (!isEmpty(filter) && Object.keys(filter).every(fullfil))
        return typeof customCondition === `function` && !isEmpty(filter)
          ? ((isFulfilled) && customCondition(element, index, col, isFulfilled))
          : (typeof customCondition === `function`
            ? customCondition(element, index, col, isFulfilled)
            : (isFulfilled))
      },
    )
    : []
}

export const chunk = <T>(array: Collection<T>, batchSize: number) =>
  Array.isArray(array)
    ? array.reduce<T[][]>((accumulator, element, index) => {
      const batchIndex = Math.floor(index / batchSize)
      if (Array.isArray(accumulator[batchIndex])) 
        accumulator[batchIndex].push(element)
      else 
        accumulator.push([element])

      return accumulator
    }, [])
    : []

export const batchOf = (index: number, total: number, batchSize: number) => `${ index + 1 } of ${ Math.floor(total / batchSize) + 1 } (${ total })`

/**
 * Transform. transforming object like with customable callback that change the result realtime.
 * @param obj 
 * @param callback 
 * @returns 
 */
export const transform = <R extends ObjectType<unknown>, T>(
  cols: ObjectType<T> | Collection<T>,
  callback: (
    result: R,
    value: T,
    key: string | number
  ) => void,
): R | undefined => {
  if (isObject(cols)) {
    const result = Object.keys(cols)
      .reduce(
        (result, colKey) => {
          callback(result, cols[colKey], colKey)
          return result
        }, Object.assign(Array.isArray(cols) ? [] : {}),
      )
    return result
  }

  return void 0
}

/**
 * Sorting array by multiple key
 * 
 * @param xs collections must be array
 * @param keys filter by this keys
 * @param argOrders if order is not specified, it will be default to ascending, if its only single value, all the key will be ordered by that value
 * @returns 
 */

export const orderBy = <
  T extends Record<string, any>,
  Ts extends Collection<T> = never,
>(
  xs: Ts | Collection<T> | undefined,
  sortingRule: Partial<Record<keyof T, ('asc' | 'desc' | -1 | 1) | Array<'asc' | 'desc' | -1 | 1>>>,
): Ts => {
  if (!Array.isArray(xs)) 
    return (xs ?? []) as Ts

  if (xs.length <= 1) 
    return ((xs as any) ?? []) as Ts
  
  const keys = Object.keys(sortingRule)

  if (!Array.isArray(keys)) 
    throw new TypeError(`keys must be array`)
  
  const sorted = xs.sort((a, b) => {
    let sortValue = 0
    for (const [index, key] of keys.entries()) {
      const aValue = a[key]
      const bValue = b[key]
      if (aValue > bValue) 
        sortValue = (sortingRule[key] === -1 || sortingRule[key] === 1 ? sortingRule[key] as number : void 0) ?? (sortingRule[key] === `asc` ? 1 : -1)

      if (aValue < bValue)
        sortValue = (sortingRule[key] === -1 || sortingRule[key] === 1 ? (sortingRule[key] as number) * -1 : void 0) ?? (sortingRule[key] === `asc` ? -1 : 1)
    }

    return sortValue
  })
  return (sorted as any) as Ts
}

export const orderByKeys = <
  T extends Record<string, any>,
  Ts extends Collection<T> = never,
  U extends keyof T = never,
>(
  xs: Ts | Collection<T> | undefined,
  keys: Array<Many<U>> = [],
  sortingRule?: ('asc' | 'desc' | -1 | 1) | Array<'asc' | 'desc' | -1 | 1>,
): Ts => {
  if (!Array.isArray(xs)) 
    return (xs ?? []) as Ts

  if (xs.length <= 1) 
    return ((xs as any) ?? []) as Ts
  
  if (!Array.isArray(keys)) 
    throw new TypeError(`keys must be array`)

  let sortingRules: Array<string | number> = []

  if (typeof sortingRule === `string` && [`asc`, `desc`].includes(sortingRule)) {
    sortingRules = new Array(keys.length).fill(sortingRule)
  } else if (Array.isArray(sortingRule) && keys.length !== sortingRule.length) {
    sortingRules = keys.map((key, index) =>
      [`asc`, `desc`].includes(String(sortingRule[index])) ? sortingRule[index] : `asc`,
    )
  } else if (Array.isArray(sortingRule) && keys.length === sortingRule.length) {
    sortingRules = sortingRule
  } else {
    sortingRules = new Array(keys.length).fill(`asc`)
  }

  const sorted = xs.sort((a, b) => {
    let sortValue = 0
    for (const [index, key] of keys.entries()) {
      const aValue = a[key]
      const bValue = b[key]
      if (aValue > bValue) 
        sortValue = (sortingRules[index] === -1 || sortingRules[index] === 1 ? sortingRules[index] as number : void 0) ?? (sortingRules[index] === `asc` ? 1 : -1)
      
      if (aValue < bValue)
        sortValue = (sortingRules[index] === -1 || sortingRules[index] === 1 ? (sortingRules[index] as number) * -1 : void 0) ?? (sortingRules[index] === `asc` ? -1 : 1)
    }
    
    return sortValue
  })
  return (sorted as any) as Ts
}

export const groupBy = <T extends Record<string, any>, C extends Collection<T>>(xs: C, key: string) => {
  const grouped = Array.isArray(xs) ? xs.reduce((rv, x) => {
    (rv[x[key]] = rv[x[key]] ?? []).push(x)
    return rv
  }, {}) : []
	
  return grouped as Record<string, C[]>
}

export const mergeArrayByKeys = <T extends Record<string, any>, Ts extends Collection<T>>(xs: Ts) => {
  let mostBigObject: Record<string, unknown> = {}
  mostBigObject = Array.isArray(xs)
    ? xs.reduce(
      (most, current) => {
        if (typeof current === `object` && Object.keys(current) > Object.keys(most)) 
          most = current

        return most
      },
      {} as unknown,
    )
    : void 0
  
  const mapped: Record<string, T[]> = {}
  Object.keys(mostBigObject).map(
    mapKey => {
      Array.isArray(xs)
        ? xs.map(
          x => {
            Array.isArray(mapped[mapKey])
              ? mapped[mapKey].push(x[mapKey])
              : mapped[mapKey] = [x[mapKey]]
          },
        )
        : void 0
    })
  return mapped
}

export const uniqueBy = <T>(array: T[], key: keyof T) => {
  // Method 1 - potential memory leak, because adding value to the set
  const seen = new Set()
  return array.filter(element => {
    const keyValue = element[key]
    if (seen.has(keyValue)) 
      return false

    seen.add(keyValue)
    return true
  })
  
  // Method 2 - no memory leak, but slower
  // return arr.filter(
  //   (el, index, self) => self.findIndex(
  //       ({ [key]: keyValue }) => keyValue === el[key],
  //     ) === index,
  // )
}

/**
 * ArrayFilter. filter nullable values from array
 * @param array 
 * @returns 
 */
export const arrayFilter = <T>(array: Collection<T>) => {
  let filtered: Array<NonNullable<T>> = []
  if (Array.isArray(array) && array.length > 0) 
    filtered = array.filter(arrayFilterFunc)

  return filtered
}

/**
 * ArrayFilterFunc. only the function for filtering nullable from array
 * @param val 
 * @returns 
 */
// eslint-disable-next-line unicorn/prevent-abbreviations
export const arrayFilterFunc = <T>(value: T): value is NonNullable<T> => value !== null && value !== undefined

export const maxNumber = (array: number[]) => array.length > 0 ? Math.max(...array) : 0
export const sumNumbers = (array: number[]) => array.length > 0 ? array.reduce((accumulator, element) => accumulator + element, 0) : 0

export const randomArrayValue = <T>(col: T[]): T | undefined => {
  if (!col) 
    return void 0

  if (col.length < 2) 
    return col[0]

  return col[Math.floor((Math.random() * col.length))]
}

export const hasConsecutive = <T>(array: T[], limit = 3, slice = -1) => {
  if (!Array.isArray(array)) 
    throw new TypeError(`arg1 must be array`)

  if (slice > 0) 
    array = array.slice(0, slice)

  let count = 0
  let value = array[0]
  return Boolean(array.some(a => {
    if (value !== a) {
      count = 0
      value = a
    }

    return ++count >= limit
  }))
}

/** --- ARRAY LIKE UTILS --- **/
/** --- END --- **/

/** --- START --- **/
/** --- OBJECT UTILS --- **/

/**
 * isObject. all object type except null is true, (Object | Array)
 * @param obj 
 * @returns 
 */

export const isObject = <T>(object: T | object): object is ObjectType<T> => object !== null && typeof object === `object`

/**
 * IsObjectType. only object type is true
 * @param obj 
 * @returns 
 */
export const isObjectType
  = <R extends Record<string, unknown>>(object: R): object is R => !Array.isArray(object) && isObject(object)

/**
 * IsPlainObject. oll Object that share Object.prototype is true. Exclude classes (Null | Object)
 * @param obj 
 * @returns 
 */
export const isPlainObject = (object: unknown) => {
  const isDefinedObject = (object_: unknown): object_ is Record<string, unknown> =>
    typeof object_ === `object`
    && object_ !== null
    && Object.prototype.toString.call(object_) === `[object Object]`

  if (object === null) 
    return true

  if (!isDefinedObject(object)) 
    return false

  const { constructor } = object
  if (typeof constructor === `undefined`) 
    return true

  const { prototype } = constructor
  return isDefinedObject(prototype) && Object.prototype.hasOwnProperty.call(prototype, `isPrototypeOf`)
}

export const toPlainObject = <T>(
  object: T,
  max_stacks = 10,
): T | undefined => {
  if (isObject(object)) {
    const plainObject: T | undefined = { ...object }
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        if (max_stacks > 0) 
          plainObject[key] = toPlainObject(object[key], max_stacks - 1)!
        else 
          plainObject[key] = object[key]

        if (Object.prototype.hasOwnProperty.call(object, key)) {
          if (max_stacks > 0) {
            const internalPlainObject = toPlainObject(object[key], max_stacks - 1)
            if (internalPlainObject) 
              plainObject[key] = internalPlainObject
          } else {
            plainObject[key] = object[key]
          }
        }
      }
    }

    return plainObject
  }

  return void 0
}

export const isEqual = (x: unknown, y: unknown) => {
  const shallowEqual = x === y
  if (shallowEqual) 
    return true

  const deepEqual = () => {
    if (isObject(x) && isObject(y)) 
      return toPlainObject(x) === toPlainObject(y)

    return false
  }

  if (deepEqual()) 
    return true

  return false
}

// eslint-disable-next-line unicorn/prevent-abbreviations
export const omitKeyProp = <T extends object>(
  object: T, key: keyof T, maxStacks = 12,
) => {
  if (maxStacks > 0 && (object && typeof object === `object`)) 
    delete object[key]

  return object
}

// eslint-disable-next-line unicorn/prevent-abbreviations
export const omitKeysProp = <T extends object>(
  object: T, keys: Array<keyof T>, maxStacks = 12,
): T => {
  if (Array.isArray(keys)) {
    for (const propertyKey of Object.values(keys)) {
      if (maxStacks > 0 && (object && typeof object === `object`)) 
        delete object[propertyKey]
    }

    return object
  }

  throw new Error(`arg2 must be array`)
}

export const omitUndefinedProperty = <T extends Record<string, any>>(object: T, _ = void 0 as any, __ = void 0 as any, maxStacks = 12) => {
  if (maxStacks > 0 && (object && typeof object === `object`)) {
    for (const key of Object.keys(object)) 
      typeof object[key] === `undefined` ? delete object[key] : void 0
  }

  return object
}

export const omitEmptyProperty = <T extends Record<string, unknown>>(object: T, _ = void 0 as any, __ = void 0 as any, maxStacks = 12) => {
  if (maxStacks > 0 && (object && typeof object === `object`)) {
    for (const key of Object.keys(object)) 
      isEmpty(typeof object[key]) ? delete object[key] : void 0
  }

  return object
}

/**
 * 
 * If arg 2 is true, it will throw an error if the env variable is not defined
 * @param varValue T
 * @param strict boolean
 * @returns NonNullable<T>
 */

export const isNull = (value: unknown): value is null | undefined =>
  value === null || value === undefined

export const nonNullValue = <E, S extends boolean = true>(
  variableValue: E,
  strict?: S,
) => {
  if (isNull(variableValue) && strict) {
    throw new Error(
      `NonNullValue - varValue is not defined!`,
    )
  }

  return variableValue as S extends true ? NonNullable<E> : NonNullable<E> | undefined
}
/** --- OBJECT UTILS --- **/
/** --- END --- **/
