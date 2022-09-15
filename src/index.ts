import EnvLoader from "@server/core/common/env_loader"
import { prettyLoggerLegacy } from "@server/core/logger/pretty_logger";
import { ApiApp } from "@server/ui/server/api_application";

EnvLoader()

const main = async () => {
  const apiApp = new ApiApp();
  await Promise.all([
    apiApp.startApp(),
  ])
}

main().catch(async error => prettyLoggerLegacy(module, `main-error`, error, `ERROR`))

export default main