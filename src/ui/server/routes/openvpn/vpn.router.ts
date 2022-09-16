import { Router } from 'express'
import { ExpressError } from '../../errors/express.error'
import { NextFunctionType } from '../../model/next_function.model'
import { exec } from 'child_process'
import { easyExistPath } from '@server/core/common/easy_file'

const defaultCertValidDay = 3
const defaultRevokeReason = 'unspecified'
const certPath = `/etc/openvpn/server/easy-rsa/pki/issued`
const privateKeyPath = `/etc/openvpn/server/easy-rsa/pki/private`

export const VpnRouter = Router()

const isCertExist = (name: string) => easyExistPath(`${certPath}/${name}.crt`)
const isKeyExist = (name: string) => easyExistPath(`${privateKeyPath}/${name}.key`)

VpnRouter.get('/add-client', (_request, _response, next: NextFunctionType) => {
    try {
        const { name, days } = _request.query

        if (!name)
            throw new ExpressError({ message: 'client name is required' })

        exec(`bash openvpn-add-client.sh ${name} ${days ?? defaultCertValidDay}`, (error, stdout, stderr) => {
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

        exec(`bash openvpn-revoke-client.sh ${name} ${reason ?? defaultRevokeReason}`, (error, stdout, stderr) => {
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

        exec(`bash openvpn-renew-cert.sh ${name} ${days ?? defaultCertValidDay}`, (error, stdout, stderr) => {
            if (error) throw new ExpressError(error.message)

            if (!isCertExist(String(name)))
                throw new ExpressError(`renew certificate failed`)

            next({ response: { raw: `client certificate renewed successfully` } })
        })
    } catch (error) {
        next({ error: new ExpressError({ error }) })
    }
})