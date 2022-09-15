import { ExpressError } from "../errors/express.error"
import { SuccessResponseData } from "../responses/success_response"
import { FileResponseData } from "./file_response.model"

export type ResponseData = {
  raw?: string | number | Record<string, unknown>;
  json?: SuccessResponseData;
  file?: FileResponseData;
}

export type ErrorResponse = ExpressError

export type NextFunctionArgs = {
  error?: ErrorResponse;
  response?: ResponseData;
}

export type NextFunctionType = (passedArguments?: NextFunctionArgs) => void
