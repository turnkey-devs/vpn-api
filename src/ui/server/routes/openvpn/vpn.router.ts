import { Router } from 'express'
import { exec } from 'child_process'
import { easyExistPath } from '@turnkeyid/utils-ts'
import {ExpressError, UnauthorizedError} from '../../errors/express.error'
import { NextFunctionType } from '../../model/next_function.model'
import { readFileSync } from 'fs'
import path from 'path'


const defaultCertValidDay = process.env.DEFAULT_CERT_VALID_DAY
const defaultRevokeReason = process.env.DEFAULT_REVOKE_REASON
const certPath = process.env.CERT_PATH
const privateKeyPath = process.env.PRIVATE_KEY_PATH
const preCommand = process.env.PRE_COMMAND
const addClientScript = process.env.ADD_CLIENT_SCRIPT
const revokeClientScript = process.env.REVOKE_CLIENT_SCRIPT
const renewCertScript = process.env.RENEW_CERT_SCRIPT

export const VpnRouter = Router()

const isCertExist = (name: string) => easyExistPath(`${certPath}/${name}.crt`)
const isKeyExist = (name: string) => easyExistPath(`${privateKeyPath}/${name}.key`)

VpnRouter.get(`/check-register`, (_request, _response, next: NextFunctionType) => {
    try {
        const { name } = _request.query

        if (!_request.access?.client?.isAuthenticated()) {
            throw new UnauthorizedError('unauthorized request to this endpoint!');
        }

        if (!name)
            throw new ExpressError({ message: 'client name is required' })

        if (isCertExist(String(name)) && isKeyExist(String(name)))
            next({
                response: {
                    json: {
                        data: `User has been registered`
                    }
                }
            })

        next({
            response: {
                json: {
                    data: `User is not exists`
                }
            }
        })

    } catch (error) {
        next({ error: new ExpressError({ error }) })
    }
})

VpnRouter.post('/add-client', (_request, _response, next: NextFunctionType) => {
    try {
        const { name, days } = _request.body

        if (!_request.access?.client?.isAuthenticated()) {
            throw new UnauthorizedError('unauthorized request to this endpoint!');
        }

        if (!name)
            throw new ExpressError({ message: 'client name is required' })

        exec(`${preCommand} ${addClientScript} ${name} ${days ?? defaultCertValidDay}`, (error, stdout, stderr) => {
            if (error) throw new ExpressError(error.message)

            if (!isCertExist(String(name)))
                throw new ExpressError(`create certificate failed`)

            if (!isKeyExist(String(name)))
                throw new ExpressError(`create key failed`)

            const ovpnFile = readFileSync(path.resolve(`ovpn`, `clients/${name}.ovpn`))

            next({
                response: {
                    file: {
                        filename: `${name}.ovpn`,
                        content: ovpnFile,
                        mimeType: `application/txt`

                    }
                }
            })
        })
    } catch (error) {
        next({ error: new ExpressError({ error }) })
    }
})

VpnRouter.post('/revoke-client', (_request, _response, next: NextFunctionType) => {
    try {
        const { name, reason } = _request.body

        if (!_request.access?.client?.isAuthenticated()) {
            throw new UnauthorizedError('unauthorized request to this endpoint!');
        }

        if (!name)
            throw new ExpressError({ message: 'client name is required' })


        exec(`${preCommand} ${revokeClientScript} ${name} ${reason ?? defaultRevokeReason}`, (error, stdout, stderr) => {
            if (error) throw new ExpressError(error.message)

            if (isCertExist(String(name)))
                throw new ExpressError(`remove certificate failed`)

            if (isKeyExist(String(name)))
                throw new ExpressError(`remove key failed`)

            next({ response: { raw: `client removed successfully` } })
        })
    } catch (error) {
        next({ error: new ExpressError({ error }) })
    }
})

VpnRouter.post(`/renew-cert`, (_request, _response, next: NextFunctionType) => {
    try {
        const { name, days } = _request.body

        if (!_request.access?.client?.isAuthenticated()) {
            throw new UnauthorizedError('unauthorized request to this endpoint!');
        }

        if (!name)
            throw new ExpressError({ message: 'client name is required' })

        exec(`${preCommand} ${renewCertScript} ${name} ${days ?? defaultCertValidDay}`, (error, stdout, stderr) => {
            if (error) throw new ExpressError(error.message)

            if (!isCertExist(String(name)))
                throw new ExpressError(`renew certificate failed`)

            next({ response: { raw: `client certificate renewed successfully` } })
        })
    } catch (error) {
        next({ error: new ExpressError({ error }) })
    }
})
