
import type { Request, Response } from "express"
import { ExpressError } from "../errors/express.error"
import type { NextFunctionArguments, NextFunctionType } from "../model/next_function.model"
import { fileResponse } from "../responses/file_response"
import { errorHandler } from "./error.handler"
import { responseLoggerMiddleware } from "./logger.middleware"
import { serverLogger } from "../logger/server_logger"
import { isEmpty } from "@turnkeyid/utils-ts"
import { mainLogger } from "@server/core/logger/appname_logger"
import { createErrorResponse } from "../responses/error_response"

class HandledError extends Error {}
export const responseMiddlewareHandler = async (
  nextArguments: NextFunctionArguments, 
  _request: Request, 
  _response: Response, 
  _next: NextFunctionType,
) => {
  try {
    if (isEmpty(nextArguments)) {
      // Throw new Error(`no next arguments, cannot handle response`)
      _next()
    }

    const { error, response: responseData } = nextArguments
    
    if (isEmpty(error) && isEmpty(responseData)) {
      serverLogger(
        `responseHandler`,
        { 
          debug: {
            url: _request.url,
            nextArgs: nextArguments,
          }, 
        },
        `error`,
      )
      throw new HandledError(`unknown response data format`)
    }
    
    if (!isEmpty(error)) {
      // Save debug to local file, for debugging
      mainLogger(
        `expressResponse:Err`
        , {
          error,
        },
        `error`,
      )

      // Provide error handler, then return it to end the response
      return await errorHandler({ error }, _request, _response, _next)
    }

    // If res.locals not found, so its a graphql request, skip it
    if (!_response.locals) {
      _next()
      return
    }

    _response.data = responseData
    const { file, json, raw } = responseData ?? {}
    responseLoggerMiddleware(_request, _response, () => void 0)

    if (file && !isEmpty(file)) {
      fileResponse(_response, file)
    } else if (!isEmpty(json)) {
      return _response.status(json.httpStatus ?? 200).json(json)
    } else if (!isEmpty(raw)) {
      return _response.status(200).end(raw)
    } else if (typeof responseData === `object`) {
      return _response.status(200).json(responseData)
    } else if (
      typeof responseData === `string`
      || typeof responseData === `number`
    ) {
      return _response.status(200).end(responseData)
    } else {
      throw createErrorResponse({
        message: `cannot handle response`,
        debug: {
          nextArgs: nextArguments,
        },
      })
    }
  } catch (error) {
    if (!(error instanceof HandledError))
      serverLogger(`FatalErr:ResponseHandler`, { error }, `error`)
    return _response.status(504).json({ error: error?.message || `SERVER ERROR` })
  }
}
