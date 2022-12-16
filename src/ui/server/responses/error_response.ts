import type { ErrorScope } from "@turnkeyid/utils-ts"
import { BaseError, modelFactory } from "@turnkeyid/utils-ts"
import { ExpressError } from "../errors/express.error"

export const createErrorResponse = ExpressError._factory
class UnauthorizedError extends BaseError {
  protected scope: ErrorScope = `PUBLIC`
  public name = `UNAUTHORIZED`
  public httpStatus = 403
  public message = `unknown error`
  public public_message?: string | undefined = `unauthorized`

  static _factory = modelFactory(UnauthorizedError, {
    allAutoGenerated: true,
  })
}

export const createUnauthorizedResponse = UnauthorizedError._factory
export const isErrorResponse = (unk: unknown): unk is ExpressError => typeof unk === `object` && (unk instanceof ExpressError || unk instanceof Error)
