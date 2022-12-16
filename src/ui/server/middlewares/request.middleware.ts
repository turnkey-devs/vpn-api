import { AccessPrincipal } from "@server/ui/models/access"
import type { Request, Response } from "express"
import { serverLogger } from "../logger/server_logger"
import type { NextFunctionArguments, NextFunctionType } from "../model/next_function.model"
import { requestLoggerMiddleware } from "./logger.middleware"
import { provideRequestIPHandler } from "./provide_request_ip"

export const requestMiddlewareHandler = async (
  _arguments: NextFunctionArguments,
  _request: Request,
  _response: Response,
  _next: NextFunctionType,
) => {
  try {
    const { error, response } = _arguments
    
    provideRequestIPHandler(_request, _response, _next)

    // Generate id or access session
    _request.access = { ..._request.access, ...new AccessPrincipal() }

    requestLoggerMiddleware(_request, _response, _next)
  } catch (error) {
    serverLogger(`RequestMiddlewareHandler:FatalError`, { error }, `ERROR`)
    return _response.status(504).send(error?.message || `SERVER ERROR`)
  }
}
