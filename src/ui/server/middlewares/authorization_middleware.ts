import { debugLogSync } from "@server/core/common/debug_log"
import { Result_ } from "@server/core/common/result"
import { secureConfig } from "@server/core/services/security/secure_config"
import { SecureJWT } from "@server/core/services/security/secure_jwt"
import { AccessClientPrincipal, AccessPrincipal } from "@server/ui/models/access"
import { Request } from "express"
import { UnauthorizedError } from "../errors/express.error"
import { QuizAuth } from "./models/quiz_auth_payload"

export const AuthorizationMiddleware = async () => {
  const _client = await SecureJWT(secureConfig)
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
      return Result_.err(`[AuthMiddleware:Err]: token undefined`)
    
    let data: R | undefined = void 0
    try {
      data = _client.decryptToken<R>(token)
    } catch (error) {
      //
      debugLogSync({ fileTitle: `auth_middleware` }, { error })
    }

    if (!data)
      return Result_.err(`[AuthMiddleware:Err]: failed to parse`)
    

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
      const clientTokenResult = auth.getTokenFromRequest<QuizAuth>(
        _request,
        [`Authorization`, `x-app-token`, `X-APP-TOKEN`, `apikey`],
      )
      
      if (clientTokenResult.isOk) {
        const { data: {
          secret,
          allow_origin: allowOrigin,
          environment,
          expired,
          scope,
        }, token } = clientTokenResult.value

        if (secret !== process.env.QUIZ_SECRET) {
          throw new UnauthorizedError({
            code: 1001,
            name: `UNAUTHORIZED`,
            message: `token invalid`,
          })
        }
        
        if (environment !== process.env.NODE_ENV) {
          throw new UnauthorizedError({
            code: 1001,
            name: `UNAUTHORIZED`,
            message: `token invalid`,
          })
        }
        
        if (expired < Date.now()) {
          // Access is expired
          throw new UnauthorizedError({
            code: 1002,
            name: `UNAUTHORIZED`,
            message: `expired`,
          })
        }

        const access = new AccessPrincipal()
        access.client = AccessClientPrincipal.factory({
          app_id: String(``),
          client_id: secret,
          client_name: String(``),
          environment,
          expired,
          scope,
        })
        access.user = _request.access?.user
        
        _request.access = access
      } else {
        debugLogSync({ fileTitle: `auth_middleware` }, { clientTokenResult })
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
