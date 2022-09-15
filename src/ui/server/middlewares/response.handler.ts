
import { debugLogSync } from "@server/core/common/debug_log"
import { isEmpty } from "@server/core/common/is_empty"
import { Request, Response } from "express"
import { serverLogger } from "../common/server_logger"
import { ExpressError } from "../errors/express.error"
import { NextFunctionArgs as NextFunctionArguments, NextFunctionType } from "../model/next_function.model"
import { fileResponse } from "../responses/file_response"
import { errorHandler } from "./error.handler"
import { responseLoggerMiddleware } from "./logger.middleware"

class HandledError extends Error {}
export const responseHandler = async (nextArguments: NextFunctionArguments, _request: Request, _response: Response, _next: NextFunctionType) => {
  try {
    if (isEmpty(nextArguments)) {
      // Throw new Error(`no next arguments, cannot handle response`)
      _next()
    }

    const { error, response: responseData } = nextArguments
    
    if (isEmpty(error) && isEmpty(responseData)) {
      serverLogger({
        name: `responseHandler`,
        subName: `unknown_response`,
        debug: {
          url: _request.url,
          nextArgs: nextArguments,
        },
        level: `error`,
      })
      throw new HandledError(`unknown response data format`)
    }
    
    if (!isEmpty(error)) {
      // Save debug to local file, for debugging
      debugLogSync({
        fileTitle: `express_response_handler`,
      }, {
        event: `responseHandler`,
        debug: { error },
      })

      try {
        // Provide error handler, then return it to end the response
        return await errorHandler({ error }, _request, _response, _next)
      } catch (error) {
        throw error
      }
    }

    // If res.locals not found, so its a graphql request, skip it
    if (!_response.locals) {
      _next()
      return
    }
    
    _response.data = responseData
    const { file, json, raw } = responseData ?? {}
    responseLoggerMiddleware(_request, _response, () => void 0)
    
    if (file && !isEmpty(file)) 
      fileResponse(_response, file)
    else if (!isEmpty(json)) 
      return _response.status(json.httpStatus ?? 200).json(json)
    else if (!isEmpty(raw)) 
      return _response.status(200).end(raw)
    else if (typeof responseData === `object`) 
      return _response.status(200).json(responseData)
    else if (
      typeof responseData === `string`
      || typeof responseData === `number`
    ) 
      return _response.status(200).end(responseData)
    else 
      throw new ExpressError(`cannot handle response`, { nextArgs: nextArguments })
  } catch (error) {
    if (!(error instanceof HandledError))
      serverLogger({ name: `ResponseMiddlewareHandler`, subName: `unhandled_error`, debug: error, level: `error` })
    return _response.status(504).json({ error: error?.message || `SERVER ERROR` })
  }
}
