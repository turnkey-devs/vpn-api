export const serverConfig = () => ({
  env: process.env.NODE_ENV,
  api: {
    port: Number(process.env.API_PORT ?? 8000),
    env: process.env.NODE_ENV ?? `development`,
  },
})

serverConfig().env === `TEST` && (serverConfig().env = `DEVELOPMENT`)