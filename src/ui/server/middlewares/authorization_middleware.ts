import { mainLogger } from "@server/core/logger/pretty_logger"
import { AccessClientPrincipal, AccessPrincipal } from "@server/ui/models/access"
import { Result_ } from "@turnkeyid/utils-ts"
import { SecureJWT } from "@turnkeyid/utils-ts/utils"
import type { Request } from "express"
import { createUnauthorizedResponse } from "../responses/error_response"
import { BaseAuth } from "./models/base_auth_payload"

export const AuthorizationMiddleware = async () => {
  const _client = SecureJWT()
  const _parseBearerAuthorization = (inputString?: string) => {
    const authHeader = inputString ?? ``
    const [code, token] = authHeader.trim().split(` `)
    return code !== `Bearer` ? void 0 : token
  }

  const getTokenFromRequest = <R>(request_: Request, fields: string[]) => {
    let token: string | undefined
    const _getTokenFromField = () => {
      for (const field of fields) {
        if (typeof token === `undefined`) {
          const tokenQuery = request_?.query && Object.keys(request_.query).length > 0
            ? request_?.query[field] : void 0
          const tokenBody = request_?.body && Object.keys(request_.body).length > 0
            ? request_.body[field] : void 0
          const tokenHeader = request_?.headers && Object.keys(request_.headers).length > 0
            ? request_.headers[field] : void 0

          // Parse token bearer
          const tokenBearer = request_?.headers?.authorization
            ? _parseBearerAuthorization(request_.headers.authorization)
            : void 0

          token = tokenQuery ?? tokenBody ?? tokenHeader ?? tokenBearer
          if (typeof token === `string`)
            return token
        }
      }
    }

    token = _getTokenFromField()

    if (!token)
      return Result_.err(`AuthorizationMiddleware:Err-> token undefined`)

    let data: R | undefined = void 0
    try {
      data = _client.decryptToken<R>(token).payload
    } catch (error) {
      mainLogger(`AuthorizationMiddleware:Err`, { error }, `error`)
    }

    if (!data)
      return Result_.err(`AuthorizationMiddleware:Err-> failed to parse`)

    return Result_.ok({ token, data })
  }

  return { getTokenFromRequest }
}

export const authorizationHandler = async (_request, _response, _next) => {
  try {
    //
    const auth = await AuthorizationMiddleware()
    _request.access = {}

    const applyClientAccess = () => {
      const clientTokenResult = auth.getTokenFromRequest<BaseAuth>(
        _request,
        [`Authorization`, `x-app-token`, `X-APP-TOKEN`, `apikey`],
      )

      if (clientTokenResult.isOk) {
        const {
          data: {
            client_id,
            environment,
            expired,
            scope,
            allow_origin,
          },
          token,
        } = clientTokenResult.value

        if (environment !== process.env.NODE_ENV) {
          throw createUnauthorizedResponse({
            code: 1001,
            name: `UNAUTHORIZED`,
            message: `token invalid`,
          })
        }

        if (expired < Date.now()) {
          // Access is expired
          throw createUnauthorizedResponse({
            code: 1002,
            name: `UNAUTHORIZED`,
            message: `expired`,
          })
        }

        const access = new AccessPrincipal()
        access.client = AccessClientPrincipal.factory({
          app_id: String(``),
          client_id: String(client_id),
          client_name: String(``),
          environment,
          expired,
          scope,
        })
        access.user = _request.access?.user

        _request.access = access
      } else {
        mainLogger(`authMiddleware`, { clientTokenResult }, `debug`)
      }
    }

    // Not used here
    // const applyUserAccess = () => {
    //   const userTokenResult = auth.getTokenFromRequest<User>(_request, [`x-user-token`, `X-USER-TOKEN`, `userkey`, `userpem`])	
    //   if (userTokenResult.isOk) {
    //     let { data: {
    //       _id,
    //       allowOrigin,
    //       email,
    //       expired,
    //       id,
    //       name,
    //       role,
    //       scope,
    //     }, token } = userTokenResult.value
    //     id = id ?? _id
				
    //     if (!id || !email) 
    //       return
				
    //     const access = new AccessPrincipal()
    //     access.client = _request.access?.client
    //     access.user = _request.access?.user
        
    //     access.user = AccessUserPrincipal.factory({
    //       email,
    //       id,
    //       name: String(name),
    //       role: String(role),

    //     })
    //     _request.access = access
    //   }
    // }
		
    applyClientAccess()
    _next()
  } catch (error) {
    _next({ error })
  }
}
