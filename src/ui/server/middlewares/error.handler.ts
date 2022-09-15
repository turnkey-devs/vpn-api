
import { debugLogSync } from "@server/core/common/debug_log"
import { prettyLoggerLegacy } from "@server/core/logger/pretty_logger"
import { Request, Response } from "express"
import { ExpressError } from "../errors/express.error"
import { NextFunctionArgs as NextFunctionArguments, NextFunctionType } from "../model/next_function.model"

const appLogger = prettyLoggerLegacy
export const errorHandler = async (nextArguments: NextFunctionArguments, request: Request, response_: Response, next: NextFunctionType) => {
  const { error } = nextArguments ?? {}
  try {
    if (error) {
      // Save debug to local file, for debugging
      debugLogSync({
        fileTitle: `express_error_handler`,
      }, {
        event: `ExpressErrorHandler`,
        debug: { error },
      })

      appLogger(module, `ExpressErrorHandler`, { error }, `ERROR`)
			
      try {
        if (error.error instanceof ExpressError && error.error.toObject) {
          const errorObject = error.error.toObject()
          error.error = errorObject
        } else if (error.error instanceof Error && error.error.toString) {
          const errorString = error?.error?.toString()
          error.error = errorString 
        }
      } catch (error) {
        appLogger(module, `ExpressErrorHandler-toString()`, error, `ERROR`)
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

      return response_.status(error.httpStatus || 500).json(error)
    }

    appLogger(module, `not handled`, { passed: nextArguments }, `ERROR`)
    throw error
  } catch (error) {
    return response_.status(500).json(error)
  }
}
