/* eslint-disable unicorn/prevent-abbreviations */
import { existsSync } from 'fs'
import path from 'path'
import dotenv, { DotenvConfigOutput } from 'dotenv'
import { expand as dotenvExpand } from 'dotenv-expand'
import appRootPathLib from 'app-root-path'
import { fastDeepMerge } from './fast_deepmerge'

/**
 * @description this method has benefit for setting process.env before loading the dotenv file
 */
 
const loadEnvironment = (forceLoad = false, defaultLoad = false) => {
  try {
    if (process.env.IS_ENV_LOADED === `true` && !forceLoad) 
      return process.env

    const oriEnvironment = process.env

    const appRootPath = appRootPathLib.path

    // Don't use process.env.ENV, because PM2 will change it to object!

    // !NOTE: FLOW:
    // If you not explicitly set NODE_ENV on your runtime, NODE_ENV will be UNDEFINED here!
    const NODE_ENV: string = process.env.NODE_ENV ?? `development`
    // NODE_ENV = typeof NODE_ENV === `string` ? String(NODE_ENV)?.toUpperCase() : `DEVELOPMENT`
    // process.env.NODE_ENV = NODE_ENV
    process.env.ENV = NODE_ENV
    process.env.ROOT_PATH = appRootPath
    // If NODE_ENV is undefined, set it to DEVELOPMENT.

    let environmentFound: DotenvConfigOutput | undefined = void 0

    // Default env = .env
    const defaultEnvironment = dotenv.config()

    let configPath = ``
    if (!environmentFound && NODE_ENV === `test`) {
      configPath = `${ appRootPath }/.env.test`
      if (existsSync(configPath)) 
        environmentFound = dotenv.config({ path: configPath })
    }

    if (!environmentFound && NODE_ENV && NODE_ENV !== ``) {
      configPath = `${ appRootPath }/.env.${ NODE_ENV.toLowerCase() }`
      if (existsSync(configPath)) 
        environmentFound = dotenv.config({ path: configPath })
    }

    if (!environmentFound) {
      configPath = `${ appRootPath }/.env`
      if (existsSync(configPath)) 
        environmentFound = dotenv.config({ path: configPath })
    }

    if (!environmentFound) {
      configPath = ``
      environmentFound = dotenv.config()
    }

    if ((!environmentFound || environmentFound?.error) && oriEnvironment.NOT_STRICT_ENV !== `true`) {
      throw new Error(JSON.stringify({
        message: `⚠️  Couldn't find ${ configPath } / .env file  ⚠️`,
        error: environmentFound?.error,
        env: process.env.ENV,
        rootPath: appRootPath,
        envFound: environmentFound,
        configPath,
      }))
    }

    const overwriteDefaultEnvironment = fastDeepMerge(
      defaultEnvironment || {},
      environmentFound || {},
    )
    // We reassign the NODE_ENV here! so it can read the NODE_ENV value from .env* file!
    // !NOT: MUST BEFORE DOTENV_EXPAND
    // BECAUSE THAT FUNCTION CHANGE MUTABLE VALUE
    // process.env.NODE_ENV = overwriteDefaultEnvironment.parsed?.NODE_ENV ?? `DEVELOPMENT`
    process.env.ENV = overwriteDefaultEnvironment.parsed?.NODE_ENV ?? `development`

    dotenvExpand({ ...overwriteDefaultEnvironment })

    process.env.ROOT_PATH = process.env.ROOT_PATH ?? appRootPath
    process.env.STORAGE_PATH = process.env.STORAGE_PATH ?? path.resolve(process.env.ROOT_PATH ?? ``, `storage`)
    process.env.IS_ENV_LOADED = `true`
  } catch (error) {
    if (defaultLoad) 
      return process.env

    throw error
  }
}
/* eslint-enable complexity */

loadEnvironment(false, true)
export const EnvLoader = () => {
  loadEnvironment(true)
  return process.env
}

export default EnvLoader
/* eslint-enable unicorn/prevent-abbreviations */
