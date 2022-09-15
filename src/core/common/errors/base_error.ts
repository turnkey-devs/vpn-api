import { isEmpty, safeJsonParse, safeJsonStringify } from "./base_error.utils"

export type ErrorScope = `PUBLIC` | `SYSTEM_ONLY` | `DEBUG_ONLY`

// eslint-disable-next-line @typescript-eslint/ban-types
type ExcludeMethod<T> = Pick<T, { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]>

type DebugType<O = Record<string, unknown>> = {
  [K in keyof O]?: O[K]
}

const hasProperty = Object.prototype.hasOwnProperty

export class BaseError<D=unknown>
  extends Error {
  public name = `ApplicationError`
  public message = ``
  public public_message?: string
  public debug?: Record<string, any>
  public stack?: string
  public error?: Error | BaseError | Record<string, any>
  public code?: number
  public method?: string
  protected scope: ErrorScope = `SYSTEM_ONLY`

  constructor(
    construct: string | Partial<ExcludeMethod<BaseError>>,
    debug?: DebugType<D>,
    override?: Partial<ExcludeMethod<BaseError>>,
  ) {
    super()
    if (!isEmpty(construct) && typeof construct === `object`) {
      for (const key in construct) {
        if (hasProperty.call(construct, key)) {
          this[key] = construct[key]
          delete construct[key]
        }
      }
    } else if (!isEmpty(construct)) {
      this.message = String(construct)
    }
			
    if (!isEmpty(override) && typeof override === `object`) {
      for (const key in override) {
        if (hasProperty.call(override, key)) {
          this[key] = override[key]
          delete override[key]
        }
      }

      override = void 0
    }
			
    if (debug instanceof Error) {
      this.error = debug
      debug = void 0
    } else if (typeof debug === `object`) {
      // Got the first error as error object
      const visit = object => {
        if (!object) 
          return object

        for (const key of Object.keys(object)) {
          if (this.error) 
            continue
							
          if (typeof object[key] === `object`) 
            visit(object[key])
							
          if (object[key] instanceof Error) {
            this.error = object[key]
            delete object[key]
          }
        }
      }

      visit(debug)
    }
			
    try {
      const nonCircular: any = safeJsonParse(debug)
      nonCircular ? this.debug = nonCircular : void 0 
    } catch {
      void 0
    }
			
    if (!this.message && this.error?.message) 
      this.message = this.error.message
  }

  public toObject() {
    try {
      return safeJsonParse(this) as ExcludeMethod<BaseError>
    } catch (error) {
      throw error
    }
  }

  public toString() {
    return safeJsonStringify(this)
  }

  public makePublic() {
    this.scope = `PUBLIC`
    if (this.message && !this.public_message) 
      this.public_message = this.message

    return this
  }

  get setScope() {
    return this.scope
  }

  set setScope(scope: ErrorScope) {
    this.scope = scope
    if (scope === `PUBLIC`) 
      this.makePublic()
  }

  get getScope() {
    return this.scope
  }

  public rename(name?: string) {
    if (name) 
      this.name = name

    return this
  }
}
