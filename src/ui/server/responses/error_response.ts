import { modelFactory } from "@server/core/common/model_factory"
import { ExpressError } from "../errors/express.error"

export class ErrorResponse extends ExpressError {
  declare code?: number
  httpStatus = 500
  status?: string
  message = `unknown error`
	
  static factory = modelFactory(ErrorResponse)
}

export const errorResponse = ErrorResponse.factory
