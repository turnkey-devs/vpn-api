import { AccessPrincipal } from "@server/ui/models/access"
import type { Request, Response } from "express"
import type { NextFunctionType } from "../model/next_function.model"

export const provideRequestIPHandler = (
  _request: Request,
  _res: Response,
  _next: NextFunctionType,
) => {
  const _filterLocalhost = (string_?: string) =>
    string_ && (string_.includes(`::ffff:`) || /127.0.0.1/.test(string_)) ? string_ : void 0
  const ip
    = _filterLocalhost(_request.header(`X-Real-IP`)) ?? _filterLocalhost(_request.ip)

  try {
    _request.ip = ip ?? _request.ip
  } catch {
    // Do nothing
  }

  _request.access = AccessPrincipal.factory({
    ..._request.access,
    ip: ip ?? _request.ip,
  })

  _next()
}
