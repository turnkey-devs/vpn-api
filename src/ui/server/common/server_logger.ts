import { baseLoggerUtil } from "@server/core/logger/pretty_logger";

export const serverLogger = baseLoggerUtil.child(`SERVER`, {
  logFilePrefix: `api`,
}).log
