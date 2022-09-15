
import { prettyLoggerLegacy } from "@server/core/logger/pretty_logger"
import { DeepObjectPlainMerge } from "@server/gateway/http_client/common/deep_object_merge"

export const requestLoggerMiddleware = async (request: any, response_: any, next: any) => {
  const requestData = DeepObjectPlainMerge(typeof request.query === `object` ? request.query : { query: request.query }, typeof request.body === `object` ? request.body : { body: request.body })
  prettyLoggerLegacy(`REQUEST`, `${ request?.url }`, {
    requestData,
  }, `INFO`)
  next()
}

export const responseLoggerMiddleware = async (request: any, response_: any, next: any) => {
  const requestData = DeepObjectPlainMerge(typeof request.query === `object` ? request.query : { query: request.query }, typeof request.body === `object` ? request.body : { body: request.body })
  const responseData = response_?.data
  prettyLoggerLegacy(`RESPONSE`, `${ request?.url }`, {
    requestData,
    responseData,
  }, `INFO`)
  next()
}
