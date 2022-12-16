import { createServer } from 'http'
import express, { Express as ApiClient } from 'express'
import { killer } from "cross-port-killer"
import { checkPort } from "get-port-please"
import cors from 'cors'
import helmet from 'helmet'
import { serverConfig } from '@server/core/config/server_config'
import { Routes } from './routes/index.routes'
import { requestLoggerMiddleware } from './middlewares/logger.middleware'
import { authorizationHandler } from './middlewares/authorization_middleware'
import { errorHandler } from './middlewares/error.handler'
import { serverLogger } from './common/server_logger'
import { sleep } from '@turnkeyid/utils-ts'
import { responseMiddlewareHandler } from './middlewares/response.middleware'

export class ApiApp {
  private readonly _config = serverConfig.api
  private _logger = serverLogger
	
  private _provideRoutes(app: ApiClient) {
    const recursiveRoutes = (routingObject: any, prefix = ``) => {
      if (typeof routingObject === `object` && Object.keys(routingObject).length > 0) {
        for (const key of Object.keys(routingObject)) {
          const router = routingObject[key]
          
          if (
            // Condition for express routes
            (router?.name === `router` && typeof router === `function`)
            // For h3 routes, this is the working condition
            || (typeof router === `object` && `handler` in router && `trace` in router && `post` in router && `get` in router)
          ) {
            const endpoint = `${ prefix }${ key }`
            app.use(endpoint, router)
          } else if (typeof router === `object`) {
            recursiveRoutes(router, key)
          }
        }
      }
    }

    recursiveRoutes(Routes)
  }
  
  private readonly _provideMiddlewares = async (app: ApiClient) => {
    try {
      app.use(express.json())
      app.use(cors())
      app.use(helmet())
      
      app.use(requestLoggerMiddleware)
      app.use(authorizationHandler)
      
      this._provideRoutes(app)
      
      app.use(responseMiddlewareHandler)
      app.use(errorHandler)
    } catch (error) {
      throw error
    }
  }
  
  private readonly _portClear = async () => {
    if (await checkPort(this._config.port) === false) {
      this._logger(
        `InitHttpServer`,
        {
          message: `
      ###			---			###
      🛡️	Server listening on port : ${serverConfig.api.port}		🛡️
      🛡️	Server environment	: ${serverConfig.api.env}	🛡️ 
      ###			---			###
      `,
        },
        `info`,
      )
      await killer.kill(this._config.port)
      await sleep(1000)
    }
  }

  public startApp = async () => {
    try {
      // Await this._portClear()
      const app = express()
      await this._provideMiddlewares(app)
      const server = createServer(app)
      server.listen(this._config.port, () => {
        this._logger(
          `InitHttpServer`,
          {
            message: `
        ###			---			###
        🛡️	Server listening on port : ${serverConfig.api.port}		🛡️
        🛡️	Server environment	: ${serverConfig.api.env}	🛡️ 
        ###			---			###
        `,
          },
          `info`,
        )
      })
    } catch (error) {
      throw error
    }
  }
}
