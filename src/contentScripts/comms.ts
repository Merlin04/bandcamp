import {ProtocolWithReturn, sendMessage} from "webext-bridge";

type ErrorResponse = {
    error: string
};

declare module "webext-bridge" {
    export interface ProtocolMap {
        proxyUrl: ProtocolWithReturn<{ url: string }, { data: string } | ErrorResponse>
    }
}

export default async function proxyUrl(url: string) {
    const res = await sendMessage("proxyUrl", {
        url
    });

    if((res as ErrorResponse).error) {
        throw new Error((res as ErrorResponse).error);
    } else return res as { data: string };
}