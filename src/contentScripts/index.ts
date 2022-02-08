/* eslint-disable no-console */
import { onMessage } from "webext-bridge";

import React from "react";
import ReactDOM from "react-dom";
import App, { setupCache } from "./App";

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(async function () {
    //@ts-expect-error
    const isBandcamp = document.querySelector("meta[name=generator]")?.content === "Bandcamp";
    //if (!isBandcamp) return;

    console.info("[vitesse-webext] Hello world from content script");

    // communication example: send previous tab title from background page
    onMessage("tab-prev", ({ data }) => {
        console.log(`[vitesse-webext] Navigate from page "${data.title}"`);
    });

    // mount component to context window
    const container = document.createElement("bandcamp-collector");
    const root = document.createElement("div");
    const shadowDOM =
        container.attachShadow?.({ mode: __DEV__ ? "open" : "closed" }) ||
        container;

    shadowDOM.appendChild(root);
    document.body.appendChild(container);

    //@ts-expect-error - it works even though typescript complains
    setupCache(shadowDOM);
    ReactDOM.render(React.createElement(App), root);
})();
