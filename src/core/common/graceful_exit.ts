export const gracefulExit = (signals: string | string[], callback: () => void) => {
  if (!Array.isArray(signals)) {
    signals = [signals]
  }

  for (const signal of signals) {
    process.on(signal, callback)
  }
}
