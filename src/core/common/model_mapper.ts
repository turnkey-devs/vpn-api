import { isEmpty } from "./is_empty"
import { Result_ } from "./result"

export const mapToMany = <M, D = any>(modelFactory: (...arguments_: any[]) => M, dataInput: D[]) => {
  if (isEmpty(dataInput) || !Array.isArray(dataInput))
    return Result_.err(`[mapToMany:Err]: data input invalid! dataInput: ${ JSON.stringify(dataInput) }`)
  if (typeof modelFactory !== `function`)
    return Result_.err(`[mapToMany:Err]: modelFacotry invalid!`)
  const mapped = dataInput
    .map(data => modelFactory(data))
  
  return Result_.ok(mapped)
}

export const mapToOne = <M>(modelFactory: (...arguments_: any[]) => M, dataInput: any) => {
  const result = mapToMany(modelFactory, [dataInput])
  if (result.isOk)
    return Result_.ok(result.value?.[0])
  return result
}
