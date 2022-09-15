import { DeepPartial } from "./common_utils"
import { isEmpty } from "./is_empty"
import { Result, Result_ } from "./result"

export type Rules<I> = Partial<{
  [K in keyof I]: true | false
}>

export type ExpectedResult<I, R extends Rules<I>> = {
  [K in keyof Required<I>]:
  R extends Record<string, never>
    ? NonNullable<I[K]>
    : R[K] extends false
      ? DeepPartial<I[K]> | undefined
      : I[K] extends object 
        ? NonNullable<DeepPartial<I[K]>>
        : NonNullable<I[K]>
}
export type ExpectedResultInverted<I, R extends Rules<I>> = {
  [K in keyof Required<I>]:
  R extends Record<string, never>
    ? I[K]
    : R[K] extends true
      ? I[K] extends object 
        ? NonNullable<DeepPartial<I[K]>>
        : NonNullable<I[K]>
      : DeepPartial<I[K]> | undefined
}

export const modelValidator = <I extends Record<any, any>, R extends Rules<I>>(
  input: I,
  rules?: R,
): Result<ExpectedResult<I, R>> => {
  if (isEmpty(input))
    return Result_.err(`modelValidator: input is empty!`)
  
  for (const [key, value] of Object.entries(input)) {
    if (((isEmpty(rules) || isEmpty(rules[key])) ? true : rules[key]) && isEmpty(value))
      return Result_.err(`modelValidator: validation failed! ${ String(key) } is missing!`)
  }
  
  return Result_.ok(input)
}

export const modelValidatorInverted = <I extends Record<any, any>, R extends Rules<I>>(
  input: I,
  rules?: R,
): Result<ExpectedResultInverted<I, R>> => {
  if (isEmpty(input))
    return Result_.err(`modelValidatorInverted: input is empty!`)
  
  for (const [key, value] of Object.entries(input)) {
    if (!isEmpty(rules) && !isEmpty(rules[key]) && isEmpty(value))
      return Result_.err(`modelValidatorInverted: validation failed! ${ String(key) } is missing!`)
  }
  
  return Result_.ok(input)
}
