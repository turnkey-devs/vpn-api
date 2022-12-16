import { BaseError, ErrorScope } from "@turnkeyid/utils-ts"

export class DatabaseError extends BaseError {
  public name = `DATABASE_ERROR`
  protected scope: ErrorScope = `SYSTEM_ONLY`
}
