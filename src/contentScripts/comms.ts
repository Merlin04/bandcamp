import {ProtocolWithReturn, sendMessage} from "webext-bridge";

declare module "webext-bridge" {
    export interface ProtocolMap {
        proxyUrl: ProtocolWithReturn<{ url: string }, { data: string }>
    }
}

export default async function proxyUrl(url: string) {
    return await sendMessage("proxyUrl", {
        url
    });
}