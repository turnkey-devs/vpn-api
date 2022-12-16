import { ApiApp } from "@server/ui/server/api_application";
import EnvLoader from "./core/config/env_loader";
import { mainLogger } from "./core/logger/pretty_logger";

EnvLoader()

const main = async () => {
  const apiApp = new ApiApp();
  await Promise.all([
    apiApp.startApp(),
  ])
}

main().catch(async error => mainLogger(`main-error`, { error }, `ERROR`))

export default main