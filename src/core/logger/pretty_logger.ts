import { prettyLoggerFactory } from '@turnkeyid/utils-ts/utils'

export const baseLoggerUtil = prettyLoggerFactory(`APPNAME`, {
  logFilePrefix: `appname_log`,
  debugging: `short`,
})
export const mainLogger = baseLoggerUtil.log
