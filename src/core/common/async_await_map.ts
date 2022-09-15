// *Credits to https://dev.to/afifsohaili/dealing-with-promises-in-an-array-with-async-await-5d7g
// with some modifications by Fatih
export const asyncAwaitMap = async <C, R>(
  collections: C[],
  doAsync: (iteration: C, index: number) => Promise<R>,
  concurrent = 1,
  options?: {
    doAfterEachBatch?: (batchResults: R[], batchIndex: number) => void | Promise<void>;
    breakCondition?: (accumulateResults: R[], iteration: number) => boolean | Promise<boolean>;
  },
): Promise<R[]> => {
  const { doAfterEachBatch, breakCondition } = options ?? {}
  const chunk = <T>(array: T[], batchSize: number) => array.reduce<T[][]>((accumulator, element, index) => {
    const batchIndex = Math.floor(index / batchSize)
    if (Array.isArray(accumulator[batchIndex])) 
      accumulator[batchIndex].push(element)
    else 
      accumulator.push([element])

    return accumulator
  }, [])

  const chunksArray = chunk(
    collections.map((value, id) => async () => doAsync(value, id)),
    concurrent,
  )

  const results: R[][] = []
  await chunksArray.reduce(async (previousBatch, currentBatch, index) => {
    await previousBatch
    
    if (breakCondition && await breakCondition(results.flat(), index)) 
      return void 0
		
    const currentBatchPromises = currentBatch.map(async asyncFunction =>
      asyncFunction(),
    )
    const result = await Promise.all(currentBatchPromises)
    doAfterEachBatch ? await doAfterEachBatch(result, index) : void 0
    results.push(result)
  }, Promise.resolve())

  return results.flat() 
}
