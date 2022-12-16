import type { ExpressError } from "../errors/express.error"
import type { SuccessResponseData } from "../responses/success_response"
import type { FileResponseData } from "./file_response.model"

export type ResponseData = {
  raw?: string | number | Record<string, unknown>;
  json?: SuccessResponseData;
  file?: FileResponseData;
}

export type ErrorResponse = ExpressError

export type NextFunctionArguments = {
  error?: ErrorResponse;
  response?: ResponseData;
}

export type NextFunctionType = (passedArguments?: NextFunctionArguments) => void
