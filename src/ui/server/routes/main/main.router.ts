import { Router } from 'express'
import { ExpressError } from '../../errors/express.error'
import { NextFunctionType } from '../../model/next_function.model'

export const MainRouter = Router()

MainRouter.get('/', async (_request, _response, next: NextFunctionType) => {
    try {
        const resp = `Open VPN Project Server`
        next({ response: { raw: resp } })
        return
    } catch (error) {
        next({ error: new ExpressError({ error }) })
    }
})