/**
 * An idea of bringing the simplest Result<T, E> from functional programming into Typescript.
 * inspired by:
 * - Rust
 * - Go Error handler
 * - https://github.com/badrap/result
 * - https://morioh.com/p/d23044ebd43f
 * - https://imhoff.blog/posts/using-results-in-typescript
 * - https://github.com/tc39/proposal-pattern-matching
 * - https://github.com/OliverBrotchie/optionals
 */
export class ResultOk<T> {
  readonly isOk = true
  constructor(
    public readonly value: T,
  ) {}
}

export class ResultError<E extends Error | undefined = Error> {
  readonly isOk = false
  readonly value = void 0
  constructor(
    public readonly error: E | undefined,
  ) {}
}

export type Result<T, E extends Error | undefined = Error> =
  | ResultOk<T>
  | ResultError<E>

/**
 * How to use? just call Result_.ok() when return OK, otherwise return error
 */
export const Result_ = {
  ok: <T>(value: T): Result<T, never> => new ResultOk(value),
  err: <E extends Error>(error?: E | string): Result<never, E> =>
    new ResultError(
      typeof error === `string`
        ? new Error(error) as E
        : error,
    ),
}
