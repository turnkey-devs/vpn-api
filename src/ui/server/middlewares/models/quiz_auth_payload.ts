import { BaseAuth } from "./base_auth_payload"

export class QuizAuth extends BaseAuth {
  constructor(
    public secret: string,
  ) {
    super()
  }
}
