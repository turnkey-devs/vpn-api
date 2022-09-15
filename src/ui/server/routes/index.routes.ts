import { MainRouter } from "./main/main.router";
import { SecretRouter } from "./secret/create_token";

export const Routes = {
    '/': MainRouter,
    '/secret': SecretRouter
}