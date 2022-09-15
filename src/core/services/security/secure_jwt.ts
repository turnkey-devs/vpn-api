import { modelValidator } from '@server/core/common/model_validator'
import type { DeepPartial, DeepRequired } from '@server/core/common/common_utils'
import { nonNullValue, randomArrayValue } from '@server/core/common/common_utils'
import { Result_ } from '@server/core/common/result'
import { Buffer } from 'buffer'
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto'
import jwt from 'jsonwebtoken'

export const DEFAULT_CONFIG_SECURE_JWT = {
  encrypt_key: process.env.SECURE_ENCRYPT_KEY,
  sign_key: process.env.SECURE_SIGN_KEY,
  auth_tag_key: String(process.env.SECURE_TAG_KEY ?? `e`),
  /** @description In MS or https://github.com/vercel/ms */
  expired_in: process.env.SECURE_EXPIRED_IN ?? `30d`, 
  issuer: process.env.SECURE_ISSUER ?? ``,
}

export type ConfigSecureJwtService = DeepRequired<typeof DEFAULT_CONFIG_SECURE_JWT>

/**
 * Create new SecureJWT client to handle general encryption and decryption
 * @param initConfig 
 * @returns 
 */
export const SecureJWT = async (initConfig?: DeepPartial<ConfigSecureJwtService>) => {
  const _client = jwt
  console.log(DEFAULT_CONFIG_SECURE_JWT)
  const _config = Object.assign(DEFAULT_CONFIG_SECURE_JWT, initConfig) as ConfigSecureJwtService
  const validConfigResponse = (() => {
    const result = modelValidator(_config)
    if (!result.isOk)
      return result
    
    if (result.value.encrypt_key.length < 34)
      return Result_.err(`encrypt key too short`)
    if (result.value.sign_key.length < 34)
      return Result_.err(`sign key too short`)

    return result
  })()

  if (!validConfigResponse.isOk)
    throw validConfigResponse.error

  // >> PRIVATE
  const _getKeystore = () => {
    const { encrypt_key } = _config
    const keysStore = [encrypt_key]
    return keysStore
  }

  // >> PRIVATE
  const _bufferText = <To extends 'string' | 'buffer'>(
    from: string | Buffer,
    to: To,
  ): To extends 'string' ? string : Buffer =>
    (
      to === `string`
        ? (Buffer.from(from).subarray(0, 32).toString(`base64`)) as any
        : (Buffer.from(from).subarray(0, 32))
    )
  
  // >> PRIVATE
  /**
  * _encryptPayload
  * @param payload<T>
  * @description  
      !input: 
      payload: {
        keyA: "valueA",
        keyB: "valueB"
      } || "payload"

      !output:
      {
        "<chipper>": "<encrypted with <chipper>+<encrypt_key>",
        "<authTagKey>": "<authTag>"
      }
  * @returns Promise<Record<string,string>>
  */  
  const _encryptHashData = <T extends Record<string, any> | string | number>(
    payload: T,
  ): Record<string, string> => {
    const { auth_tag_key } = _config
    const keystore = _getKeystore()
    const key = randomArrayValue(keystore)
    if (!key) 
      throw new Error(`_encryptPayload - key undefined`)

    const iv = randomBytes(16)
    const encChipper = createCipheriv(
      `aes-256-gcm`,
      _bufferText(key, `buffer`),
      iv,
    )
    const stringifyPayload = JSON.stringify(payload)
    const encrypted = encChipper.update(stringifyPayload, `utf-8`)
    const finalEnc = Buffer.concat([encrypted, encChipper.final()])
    const authTag = encChipper.getAuthTag()
    return {
      [`${ iv.toString(`hex`) }`]: finalEnc.toString(`base64`),
      [`${ auth_tag_key }`]: authTag.toString(`hex`),
    }
  }

  // >> PRIVATE
  /**
  * _decryptPayload
  * @param parsedToken
  * @description  
      !input: 
      payload: {
        keyA: "valueA",
        keyB: "valueB"
      } || "payload"

      !output:
      {
        "<chipper>": "<encrypted with <chipper>+<encrypt_key>"
      }
  * @returns Promise<R>
  */
  const _decryptHashData = <
    R extends { parsedPayload: string | number | Record<string, any>; tokenInfo: Record<string, any> },
    T extends Record<string, any> | string,
  >(
    parsedToken: T,
  ): R => {
    const { auth_tag_key } = _config
    const keystore = _getKeystore()
    const key = randomArrayValue(keystore)
    if (!key) 
      throw new Error(`_decryptToken - key undefined`)

    let encryptedPayload: Record<string, T[keyof T]> | undefined = void 0
    const tokenInfo: Record<string, unknown> = {}
    let authTagString: string | undefined = void 0

    for (const key in parsedToken) {
      if (Object.prototype.hasOwnProperty.call(parsedToken, key)) {
        // Get encrypted payload key, by excluding all default JWT keys
        if (![`iss`, `exp`, `iat`].includes(key) && key.length > 3) {
          encryptedPayload = {
            [`${ key }`]: parsedToken[key],
          }
        } else if (key === auth_tag_key && parsedToken[key]) {
          authTagString = String(parsedToken[key])
        } else {
          tokenInfo[`${ key }`] = parsedToken[key]
        }
      }
    }

    if (!encryptedPayload) 
      throw new Error(`_decryptToken - failed to get encrypted data`)

    if (!authTagString) 
      throw new Error(`_decryptToken - failed to get authTag`)

    const ivKey = Object.keys(encryptedPayload)[0]
    const iv = Buffer.from(ivKey, `hex`)
    const encryptedData = Buffer.from(String(encryptedPayload[ivKey]), `base64`)
    const deChipper = createDecipheriv(
      `aes-256-gcm`,
      _bufferText(key, `buffer`),
      iv,
    )
    const authTag = Buffer.from(authTagString, `hex`)
    deChipper.setAuthTag(authTag)
    const decrypted = deChipper.update(encryptedData)
    const finalDec = Buffer.concat([decrypted, deChipper.final()])
    const parsedPayload = JSON.parse(finalDec.toString())
    const result = { parsedPayload, tokenInfo }
    return result as R
  }

  // >> PUBLIC
  /**
   * Secure your JWT payload with this method. 
   * this method will encrypt your data, then return JWT Signed Token
   * @param payload 
   * @param options
   * @returns 
   */
  const encryptPayload = <T extends Record<string, any>>(
    payload: T,
    options?: {
      /** @description In MS or https://github.com/vercel/ms */
      expiresIn?: string | number;
    },
  ): string => {
    const { sign_key, expired_in } = _config
    const encryptedPayload = _encryptHashData(payload)
    const expiresIn = options?.expiresIn ?? expired_in
    const token = _client.sign(encryptedPayload,
      nonNullValue(sign_key, true),
      {
        algorithm: `HS256`,
        encoding: `utf8`,
        expiresIn,
        issuer: _config.issuer,
      })
    return token
  }

  // >> PUBLIC
  /**
   * Decrypt your encrypted token.
   * this method will verify the JWT sign then decrypt the data
   * returning desired object
   * @param payload 
   * @returns 
   */
  const decryptToken = <R extends Record<string, any>>(
    token: string,
    options?: {
      ignoreExpired: false;
    },
  ): R => {
    options = { ignoreExpired: false, ...options }
    const { sign_key } = _config
    
    const encryptedPayload = _client.verify(token, nonNullValue(sign_key, true))
    const { parsedPayload: payload, tokenInfo } = _decryptHashData(encryptedPayload)
    
    if (!options.ignoreExpired && Number(tokenInfo.exp) <= (Date.now() / 1e3))
      throw new Error(`token is expired!`)
    
    return payload as R
  }
  
  return {
    decryptToken, encryptPayload,
  }
}

/**
 * Legacy version with class
 * @deprecated use SecureJWT please
 */
export class SecureJwtV1 {
  static factory = () => {
    const instance = new SecureJwtV1()
    instance.init()
    return instance
  }

  private _config = DEFAULT_CONFIG_SECURE_JWT
  private readonly _client = jwt
  
  public init = (config?: DeepPartial<ConfigSecureJwtService>) => {
    this._config = { ...this._config, ...config }
  }

  /**
   * Secure your JWT payload with this method. 
   * @param payload 
   * @returns 
   */
  public encryptPayload = <T extends Record<string, any>>(
    payload: T,
  ): string => {
    const { sign_key, expired_in, issuer } = this._getConfig()
    const encryptedPayload = this._encryptPayload(payload)
    const token = this._client.sign(encryptedPayload, nonNullValue(sign_key, true), {
      algorithm: `HS256`,
      encoding: `utf8`,
      expiresIn: expired_in,
      issuer,
    })
    return token
  }

  /**
   * Decrypt your secure token, the JWT data can only be decrypted with this method.
   * @param payload 
   * @returns 
   */
  public decryptToken = <R extends Record<string, any>>(
    token: string,
  ): R => {
    const { sign_key } = this._getConfig()
    const encryptedPayload = this._client.verify(token, nonNullValue(sign_key, true))
    const { parsedPayload: payload } = this._decryptPayload(
      encryptedPayload,
    )
    return payload as R
  }

  private readonly _getConfig = () => this._config
  private readonly _getKeystore = () => {
    const { encrypt_key } = this._getConfig()
    const keysStore = [encrypt_key]
    return keysStore
  }

  private readonly _bufferText = <To extends 'string' | 'buffer'>(
    from: string | Buffer,
    to: To,
  ): To extends 'string' ? string : Buffer =>
    (
      to === `string`
        ? (Buffer.from(from).slice(0, 32).toString(`base64`)) as any
        : (Buffer.from(from).slice(0, 32))
    )
  
  /**
  * 
  * _encryptPayload
  * @param payload<T>
  * @description  
      !input: 
      payload: {
        keyA: "valueA",
        keyB: "valueB"
      } || "payload"

      !output:
      {
        "<chipper>": "<encrypted with <chipper>+<encrypt_key>",
        "<authTagKey>": "<authTag>"
      }
  * @returns Promise<Record<string,string>>
  */
  private readonly _encryptPayload = <T extends Record<string, any> | string | number>(
    payload: T,
  ): Record<string, string> => {
    const { auth_tag_key } = this._getConfig()
    const keystore = this._getKeystore()
    const key = randomArrayValue(keystore)
    if (!key) 
      throw new Error(`_encryptPayload - key undefined`)

    const iv = randomBytes(16)
    const encChipper = createCipheriv(
      `aes-256-gcm`,
      this._bufferText(key, `buffer`),
      iv,
    )
    const stringifyPayload = JSON.stringify(payload)
    const encrypted = encChipper.update(stringifyPayload, `utf-8`)
    const finalEnc = Buffer.concat([encrypted, encChipper.final()])
    const authTag = encChipper.getAuthTag()
    return {
      [`${ iv.toString(`hex`) }`]: finalEnc.toString(`base64`),
      [`${ auth_tag_key }`]: authTag.toString(`hex`),
    }
  }

  /**
  * 
  * _decryptPayload
  * @param parsedToken
  * @description  
      !input: 
      payload: {
        keyA: "valueA",
        keyB: "valueB"
      } || "payload"

      !output:
      {
        "<chipper>": "<encrypted with <chipper>+<encrypt_key>"
      }
  * @returns Promise<R>
  */
  private readonly _decryptPayload = <
    R extends { parsedPayload: string | number | Record<string, any>; tokenInfo: Record<string, any> },
    T extends Record<string, any> | string,
  >(
    parsedToken: T,
  ): R => {
    const { auth_tag_key } = this._getConfig()
    const keystore = this._getKeystore()
    const key = randomArrayValue(keystore)
    if (!key) 
      throw new Error(`_decryptToken - key undefined`)

    let encryptedPayload: Record<string, T[keyof T]> | undefined = void 0
    const tokenInfo: Record<string, unknown> = {}
    let authTagString: string | undefined = void 0
    for (const key in parsedToken) {
      if (Object.prototype.hasOwnProperty.call(parsedToken, key)) {
        if (![`iss`, `exp`, `iat`].includes(key) && key.length > 3) {
          encryptedPayload = {
            [`${ key }`]: parsedToken[key],
          }
        } else if (key === auth_tag_key && parsedToken[key]) {
          authTagString = String(parsedToken[key])
        } else {
          tokenInfo[`${ key }`] = parsedToken[key]
        }
      }
    }

    if (!encryptedPayload) 
      throw new Error(`_decryptToken - failed to get encrypted data`)

    if (!authTagString) 
      throw new Error(`_decryptToken - failed to get authTag`)

    const ivKey = Object.keys(encryptedPayload)[0]
    const iv = Buffer.from(ivKey, `hex`)
    const encryptedData = Buffer.from(String(encryptedPayload[ivKey]), `base64`)
    const deChipper = createDecipheriv(
      `aes-256-gcm`,
      this._bufferText(key, `buffer`),
      iv,
    )
    const authTag = Buffer.from(authTagString, `hex`)
    deChipper.setAuthTag(authTag)
    const decrypted = deChipper.update(encryptedData)
    const finalDec = Buffer.concat([decrypted, deChipper.final()])
    const parsedPayload = JSON.parse(finalDec.toString())
    const result = { parsedPayload, tokenInfo }
    return result as R
  }
}
