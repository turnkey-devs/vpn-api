export type PerfTimerResult = {
  start: () => PerfTimerResult;
  end: (customMessage?: ((elapsedMs: number, elapsedSeconds: number) => void) | undefined) => void;
  startTime: number;
  elapsedTime: () => number;
  elapsedTimeS: () => number;
}

export const perfTimer = (customMessageRoot?: (elapsedMs: number) => void): PerfTimerResult => {
  let thisSelf = Object.assign({}) as PerfTimerResult
  let _startTime = Date.now()
  const start = () => {
    _startTime = Date.now()
    return thisSelf
  }

  const end = (customMessage?: (elapsedMs: number, elapsedSeconds: number) => void) => {
    const elapsed = Date.now() - _startTime
    if (customMessage) {
      customMessage(elapsed, elapsed / 1000)
    } else if (customMessageRoot) {
      customMessageRoot(elapsed)
    } else {
      console.info(`done in ${elapsed}ms`)
    }
  }

  const result = {
    start,
    end,
    startTime: _startTime,
    elapsedTime: () => Date.now() - _startTime,
    elapsedTimeS: () => (Date.now() - _startTime) / 1000,
  }
  thisSelf = result
  return thisSelf
}
