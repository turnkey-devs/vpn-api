import { DeepObjectPlainMerge } from "@turnkeyid/utils-ts"
import { serverLogger } from "../logger/server_logger"

export const requestLoggerMiddleware = async (
  request: any,
  res: any,
  next: any,
) => {
  const requestData = DeepObjectPlainMerge(
    typeof request.query === `object` ? request.query : { query: request.query },
    typeof request.body === `object` ? request.body : { body: request.body },
  )
  const forwardedFor = request.header(`X-Forwarded-For`)
  const forwardedProto = request.header(`X-Forwarded-Proto`)

  serverLogger(
    `REQUEST:${ request?.url }`,
    {
      requestData,
      userInfo: {
        ip: request.ip,
        forwardedFor,
        forwardedProto,
      },
    },
    `info`,
  )
  next()
}

export const responseLoggerMiddleware = async (
  request: any,
  res: any,
  next: any,
) => {
  const requestData = DeepObjectPlainMerge(
    typeof request.query === `object` ? request.query : { query: request.query },
    typeof request.body === `object` ? request.body : { body: request.body },
  )
  const ip = request.header(`X-Real-IP`) ?? request.ip
  const responseData = res?.passed
  serverLogger(
    `RESPONSE:${ request?.url }`,
    {
      requestData,
      responseData,
    },
    `info`,
  )
  next()
}
