export class BaseAuth {
  // Because we will extend it, and to avoid
  // conflict with super(), we just do it this way
  // !TODO: for now...
  public client_id: string = void 0 as any
  public scope: string = void 0 as any
  public environment: string = process.env.NODE_ENV!

  /** @description Expired DateTime in MS */
  public expired = 0

  public allow_origin = ``
}
