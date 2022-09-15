import { sleep } from "./common_utils"
import { perfTimer } from "./perf_timer"

// Main function,
// first arg, doAnything is place where you put the code to run later
// second arg, loopTimeoutMs is the timer, how long the loop will run
// timingMs is the delay for each loop,
// last arg, its options,
// - maxIterations for limiting maximum iteration times / loop times
// - doAfterEach, doing something when the supposed code done.
export const loopingCertainTime = async (
  doAnything: (iteration: number) => void | Promise<void>,
  loopTimeoutMs = 1000,
  timingMs = 1000,
  options?: {
    skipPromise?: boolean;
    maxIterations?: number;
    breakCondition?: (iteration: number, elapsedSeconds: number) => boolean | Promise<boolean>;
  },
): Promise<void> => {
  const { maxIterations, breakCondition, skipPromise } = options ?? {}
  const timer = perfTimer()
  
  let iteration = 0
  let keepLoop = true

  // Same as before, it will change the keepLoop value, after certain time
  if (loopTimeoutMs > 0) {
    setTimeout(() => {
      keepLoop = false 
    }, loopTimeoutMs + 200)
  } // 200ms tolerance

  // looping
  /* eslint-disable no-await-in-loop */
  while (keepLoop) {
    // Start doing anything
    if (!skipPromise) 
      await doAnything(iteration)
    else 
      doAnything(iteration)?.catch(console.error)
    
    // If there is a break condition, check it
    if (breakCondition && await breakCondition(iteration, timer.elapsedTimeS())) {
      keepLoop = false
      break
    }
    
    // If the keepLoop value is changed to false, break the loop!
    if (!keepLoop) 
      break

    // If the iterations over maxIterations, break the loop!
    if (maxIterations && iteration >= maxIterations) 
      break

    iteration++

    // The secret so the code wont hang or resource intensive!
    await sleep(timingMs)
  }
  /* eslint-enable no-await-in-loop */
}
