import { BaseError, ErrorScope } from "@server/core/common/errors/base_error"

export class ExpressError extends BaseError {
  name = `EXPRESS_ERROR`
  protected scope: ErrorScope = `PUBLIC`
  public error?: any = {}
  public httpStatus = 500
}

export class UnauthorizedError extends ExpressError {
  name = `UNAUTHORIZED`
  public httpStatus = 403
}
