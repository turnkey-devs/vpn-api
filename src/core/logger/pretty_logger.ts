import path from 'path'
import consola from 'consola'
import { getFormattedDate } from '../common/date_helper'
import { safeJsonStringify } from '../common/safe_json_parse'

const SHOW_DETAIL_DEBUG = process.env.SHOW_DETAIL_DEBUG === `true` || false
const SHOW_SHORT_DEBUG = process.env.SHOW_SHORT_DEBUG === `true` || true

export type PrettyLoggerLevel = 'warn' | 'info' | 'debug' | 'ready' | 'error'
export type PrettyLoggerOptions = {
  debug?: any;
  message?: string;
  __showDebugConsole?: boolean;
}
export type PrettyLoggerResult = {
  mainMessage: string;
  debugMessage?: string;
  level: string;
}
export interface PrettyLogger {
  (label: string, options?: PrettyLoggerOptions, level?: PrettyLoggerLevel): PrettyLoggerResult;
  (label: string, data?: any, level?: PrettyLoggerLevel): PrettyLoggerResult;
  (label: string, data?: any, level?: string): PrettyLoggerResult;
}

export const prettyLogger: PrettyLogger = (moduleNameOrLabel, optionsOrData, level = `info`) => {
  const getTime = () => getFormattedDate(new Date(), `YYYY-MM-DD HH:mm:ss`)
  const { message, __showDebugConsole } = optionsOrData ?? {}
  const stringifiedDebug = optionsOrData ? safeJsonStringify(optionsOrData, 1) : void 0 

  const mainMessage = `[${ getTime() }] [${ level }] [${ moduleNameOrLabel }] [pid: ${ process.pid }]${ message ? ` - ${ message }` : `` }`
  
  if (consola[level])
    consola[level](mainMessage)
  
  const detailDebugMessage = (__showDebugConsole !== false && SHOW_DETAIL_DEBUG) && stringifiedDebug ? stringifiedDebug : void 0
  const shortDebugMessage = (__showDebugConsole !== false && SHOW_SHORT_DEBUG) && stringifiedDebug ? stringifiedDebug : void 0
  
  if (!detailDebugMessage && shortDebugMessage)
    consola.warn(`>`, stringifiedDebug?.slice(0, 256), `<`)
  
  if (detailDebugMessage)
    consola.warn(`==>`, stringifiedDebug, `<--`)
  
  return { mainMessage, stringifiedDebug, level }
}

const moduleParser = (callerModule: typeof module | string): string => {
  // To support files which don't have an module
  if (typeof callerModule === `string`) 
    return callerModule

  if (callerModule && typeof callerModule === `object` && callerModule?.filename) {
    const parts = callerModule.filename.split(path.sep)
    return path.join(parts[parts.length - 2], parts?.pop() ?? ``)
  }

  return String(callerModule)
}

export interface PrettyLoggerLegacy {
  (moduleName: typeof module | string, label: string, _anything: any, level: "ERROR" | "WARN" | "DEBUG" | "INFO");
}
export const prettyLoggerLegacy: PrettyLoggerLegacy = (...arguments_) => prettyLogger(
  `${ moduleParser(arguments_[0]) }`,
  {
    message: arguments_[1],
    debug: arguments_[2],
  },
  arguments_[3].toLocaleLowerCase(),
)
