import { BaseError } from "./base_error"

export class InternalError extends BaseError {
  name = `INTERNAL_ERROR`
}
