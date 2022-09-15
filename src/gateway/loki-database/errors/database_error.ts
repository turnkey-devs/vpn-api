import { BaseError, ErrorScope } from "@server/core/common/errors/base_error"

export class DatabaseError extends BaseError {
  public name = `DATABASE_ERROR`
  protected scope: ErrorScope = `SYSTEM_ONLY`
}
