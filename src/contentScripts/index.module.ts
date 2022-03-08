import React from "react";
import ReactDOM from "react-dom";
import App, { setupCache } from "./App";

declare global {
    var _BANDCAMP_COLLECTOR_SHADOW_DOM: ShadowRoot;
}

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
// If this is being loaded as a System module then this is pointless but it might be bundled using Rollup so keep it anyway
(async function () {
    // Yeah sure that works
    const isBandcamp = document.querySelector("a[href='https://bandcamp.com/terms_of_use']");
    if (!isBandcamp) return;

    console.info("[bandcamp-collector] Content script activated");

    // Clean up any existing instances (from HMR)
    const existingInstances = document.getElementsByTagName("bandcamp-collector");
    if(existingInstances.length > 0) {
        Array.from(existingInstances).forEach(instance => {
            ReactDOM.unmountComponentAtNode(instance.shadowRoot!.children[0]);
            instance.remove();
        });
    }

    // mount component to context window
    const container = document.createElement("bandcamp-collector");
    const root = document.createElement("div");
    const shadowDOM =
        container.attachShadow?.({ mode: __DEV__ ? "open" : "closed" }) ||
        container;

    shadowDOM.appendChild(root);
    document.body.appendChild(container);

    window._BANDCAMP_COLLECTOR_SHADOW_DOM = shadowDOM;

    //@ts-expect-error - it works even though typescript complains
    setupCache(shadowDOM);
    ReactDOM.render(React.createElement(App), root);
})();
