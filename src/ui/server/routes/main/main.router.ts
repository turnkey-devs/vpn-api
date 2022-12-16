import type { NextFunctionType } from '@server/ui/server/model/next_function.model'
import { successResponse } from '@server/ui/server/responses/success_response'
import { Router } from 'express'
import { createErrorResponse, isErrorResponse } from '../../responses/error_response'

export const MainRouter = Router()

MainRouter.get(`/`, async (_request, _response, next: NextFunctionType) => {
  try {
    const resp = `Open VPN Project Server`
    next({ response: { raw: resp } })
    return
  } catch (error) {
    next({
      error: isErrorResponse(error)
        ? error
        : createErrorResponse({ error }),
    })
  }
})

MainRouter.get(`/health`, async (_request, _response, next: NextFunctionType) => {
  try {
    const resp = successResponse({
      status: `OK`,
      code: 200,
      message: `API Active`,
      data: { environtment: process.env.NODE_ENV },
    })
    next({ response: { json: resp } })
    return
  } catch (error) {
    next({
      error: isErrorResponse(error)
        ? error
        : createErrorResponse({ error }),
    })
  }
})
