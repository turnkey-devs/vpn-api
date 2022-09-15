import sift, { Query as SiftQuery } from 'sift'
import { Collection } from './common_utils'
import { isEmpty } from './is_empty'

export type QueryType<T> = SiftQuery<T>

export const findManyQuery = <T extends object>(
  col: Collection<T> | undefined,
  query?: QueryType<T>,
  customCondition?: (element: T, index: number, _: T[], filterFullfil: boolean) => boolean,
): T[] => {
  if ((isEmpty(query) && !customCondition) || isEmpty(col)) {
    return []
  }
  
  return Array.isArray(col) 
    ? col.filter(
      (item, key, owner) => {
        const isFullfil = sift(query)(item, key, owner)
        
        if (!isEmpty(query) && typeof customCondition === `function`) {
          return Boolean(isFullfil) && customCondition(item, key, owner, isFullfil)
        }
        
        return typeof customCondition === `function`
          ? customCondition(item, key, owner, true)
          : Boolean(isFullfil)
      },
    )
    : []
}

export const findQuery = <T extends object>(
  col: Collection<T> | undefined,
  query?: QueryType<T>,
  customCondition?: (element: T, index: number, _: T[], filterFullfil: boolean) => boolean,
): T | undefined => {
  if ((isEmpty(query) && !customCondition) || isEmpty(col)) {
    return void 0
  }
  
  const results = findManyQuery(col, query, customCondition)
  return results.length > 0 ? results[0] : void 0
}
