import { onMessage } from "webext-bridge";

// only on dev mode
//@ts-expect-error
if (import.meta.hot) {
    // @ts-expect-error for background HMR
    import("/@vite/client");
    // load latest content script
    import("./contentScriptHMR");
}

browser.runtime.onInstalled.addListener((): void => {
    // eslint-disable-next-line no-console
    console.log("Extension installed");
});

onMessage<{
    url: string
}, "proxyUrl">("proxyUrl", async (msg) => {
    try {
        const url = msg.data.url;

        // Fetch the url
        const data = await fetch(url).then((res) => res.text());

        return {
            data
        };
    } catch(e) {
        return {
            error: (e as Error).stack ?? (e as Error).message
        };
    }
});