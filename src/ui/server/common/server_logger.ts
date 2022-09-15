import { prettyLogger } from "@server/core/logger/pretty_logger"

const LoggerLevel = [`debug`, `error`, `info`, `ready`, `warn`] as const
type LoggerLevelType = typeof LoggerLevel[number]

export const stringToLoggerLevel = (_string: string): _string is LoggerLevelType => !!LoggerLevel[_string]

export const serverLogger = (request: {
  name: string;
  subName?: string;
  message?: string;
  debug?: any;
  level?: LoggerLevelType;
}) => { 
  const { message, debug, subName, name, level } = request
  prettyLogger(`[${ name }/${ subName }]: ${ message }`, { debug }, level)
  return void 0
}
