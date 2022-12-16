import { asyncAwaitMap, sleep } from "@turnkeyid/utils-ts";

type RetryType = {
  result?: any;
  error?: Error | undefined;
  success: boolean;
}
export const retryAsync = async <R>(
  task: (lastRetry: RetryType | undefined, index: number, retries: RetryType[]) => R | Promise<R>,
  maxRetry = 3,
  options?: {
    doEachFail?: (error: Error, index: number, retries: RetryType[]) => void | Promise<void>;
    delayExecutionMs?: number;
  },
): Promise<R> => {
  const { doEachFail, delayExecutionMs } = options ?? {}

  const retriesPool: RetryType[] = []

  await asyncAwaitMap(
    new Array(maxRetry).fill(0),
    async (_, index) => {
      try {
        const result = await task(
          retriesPool[index - 1],
          index,
          retriesPool,
        )
        retriesPool.push({ success: true, result, error: void 0 })
      } catch (error) {
        if (doEachFail) 
          await doEachFail(error, index, retriesPool)

        if (delayExecutionMs) 
          await sleep(delayExecutionMs)

        retriesPool.push({ success: false, result: void 0, error })
      }
    },
    1,
    {
      breakCondition: () => retriesPool.some(({ success }) => Boolean(success)),
    },
  )

  if (retriesPool.some(({ success }) => Boolean(success))) {
    const result = retriesPool.find(({ success }) => Boolean(success))
    return result?.result
  }

  throw retriesPool.find(({ error }) => Boolean(error))?.error
}
