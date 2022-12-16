import { getDateOffset, isEmpty } from '@turnkeyid/utils-ts';
import { SecureJWT } from '@turnkeyid/utils-ts/utils';
import { Request, Response, Router } from 'express'
import { ExpressError } from '../../errors/express.error';
import { QuizAuth } from '../../middlewares/models/quiz_auth_payload';
import { NextFunctionType } from "../../model/next_function.model";
import { successResponse } from '../../responses/success_response';

export const SecretRouter = Router()

SecretRouter.post("/create_token",
    async (_request: Request, _response: Response, next: NextFunctionType) => {
        try {
            const {
                client_id,
                secret,
                expired,
                environment,
                allow_origin
            } = _request.body ?? {}

            const secureJWT = await SecureJWT()

            const tokenExpired = !isEmpty(expired) ? Number(expired) : getDateOffset(Date.now(), 1, `year`).valueOf()
            const token = secureJWT.encryptPayload<QuizAuth>({
                client_id,
                secret,
                environment,
                scope: `PUBLIC`,
                expired: tokenExpired,
                allow_origin,
            })

            next({
                response: {
                  json: successResponse({ data: { token, input: _request.body, expired: tokenExpired } })
                }
            })

            if (isEmpty(token))
                throw new ExpressError(`create token failed`)
        } catch (error) {
            next({ error: new ExpressError({ error }) })
        }
    }
)