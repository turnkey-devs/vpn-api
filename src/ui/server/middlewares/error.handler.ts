
import type { Request, Response } from "express"
import type { NextFunctionArguments, NextFunctionType } from "../model/next_function.model"
import { serverLogger } from "../logger/server_logger"
import { safeJsonParse } from "@turnkeyid/utils-ts"
import { isErrorResponse } from "../responses/error_response"

const appLogger = serverLogger
export const errorHandler = async (
  nextArguments: NextFunctionArguments,
  _request: Request,
  _response: Response,
  _next: NextFunctionType,
) => {
  let { error } = nextArguments ?? {}
  error = safeJsonParse(error) // Serialize error

  try {
    if (error) {
      appLogger(`expressErrorHandler`, { error }, `error`)

      try {
        if (isErrorResponse(error.error)) {
          const errorObject = error.error.toObject()
          error.error = errorObject
        } else if (error.error instanceof Error && error.error.toString) {
          const errorString = error?.error?.toString()
          error.error = { message: errorString }
        }
      } catch (error) {
        appLogger(`ExpressErrorHandler-toString()`, { error }, `ERROR`)
      }

      // Safely handle remove stack from error response 
      try {
        const removeStack = (object: Record<string, any>) => {
          if (typeof object === `object`) {
            for (const key in object) {
              if (Object.prototype.hasOwnProperty.call(object, key)) {
                if (typeof object[key] === `object`) 
                  removeStack(object[key])

                delete object.stack
                delete object.stacks
              }
            }
          }
        }

        if (typeof error === `object`) 
          removeStack(error)
      } catch {
        void 0
      }

      return _response.status(error.httpStatus || 500).json(error)
    }

    appLogger(`FatalErr:not_handled`, { passed: nextArguments }, `ERROR`)
    throw error
  } catch (error) {
    return _response.status(500).json(error)
  }
}
