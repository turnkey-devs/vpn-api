export class AuthTokenPayload {
  constructor(
    public id: string,
    public access: string,
    public expired: number,
  ) {}
}
