import { debugLogSync } from "../common/debug_log"

export const serverConfig = {
  merchant: {
    front_end_host: `${ process.env.FRONT_END_HOST }`,
  },
  api: {
    port: Number(process.env.API_PORT ?? 8000),
    env: process.env.NODE_ENV ?? `development`,
    db_context: process.env.DB_CONTEXT ?? `default`,
  },
  auth: {
    encrypt_key: process.env.AUTH_ENCRYPT_KEY,
    sign_key: process.env.AUTH_SIGN_KEY,
    auth_tag_key: String(process.env.AUTH_TAG_KEY ?? `e`),
    expired_in_s: Number(process.env.AUTH_EXPIRED_IN_MS ?? 60 * 60 * 24 * 30 /* default: 30 days */),
  },
  notification: {
    notif_throttle: Number(process.env.NOTIF_THROTTLE ?? 2),
    interval: Number(process.env.NOTIF_INTERVAL ?? 30_000 /* default: 30 seconds */),
  },
}

try {
  if (!serverConfig.merchant?.front_end_host)
    throw new Error(`merchant.front_end_host undefined!`)
} catch (error) {
  debugLogSync({ fileTitle: `server` }, { error })
  throw new Error(`[ServerConfig: FATAL ERROR]: config error, check log!`)
}
