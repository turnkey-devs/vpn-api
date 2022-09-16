import { MainRouter } from "./main/main.router";
import { VpnRouter } from "./openvpn/vpn.router";
import { SecretRouter } from "./secret/create_token";

export const Routes = {
    '/': MainRouter,
    '/vpn': VpnRouter,
    '/secret': SecretRouter
}