import { Router } from 'express'
import { ExpressError } from '../../errors/express.error'
import { NextFunctionType } from '../../model/next_function.model'
import { exec } from 'child_process'
import { easyExistPath } from '@server/core/common/easy_file'

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

VpnRouter.get('/add-client', (_request, _response, next: NextFunctionType) => {
    try {
        const { name, days } = _request.query

        if (!name)
            throw new ExpressError({ message: 'client name is required' })
        
        console.log(`${preCommand} ${addClientScript} ${name} ${days ?? defaultCertValidDay}`)

        exec(`${preCommand} ${addClientScript} ${name} ${days ?? defaultCertValidDay}`, (error, stdout, stderr) => {
            if (error) throw new ExpressError(error.message)

            if (!isCertExist(String(name)))
                throw new ExpressError(`create certificate failed`)

            if (!isKeyExist(String(name)))
                throw new ExpressError(`create key failed`)

            next({ response: { raw: `client added successfully` } })
        })
    } catch (error) {
        next({ error: new ExpressError({ error }) })
    }
})

VpnRouter.get('/revoke-client', (_request, _response, next: NextFunctionType) => {
    try {
        const { name, reason } = _request.query

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

VpnRouter.get(`/renew-cert`, (_request, _response, next: NextFunctionType) => {
    try {
        const { name, days } = _request.query

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