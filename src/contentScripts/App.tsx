import { Fab, Zoom } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache, { EmotionCache } from "@emotion/cache";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import React, { useEffect } from "react";
import { setState, useStore } from "./state";
import AppDialog from "./AppDialog";

let cache: EmotionCache;

export function setupCache(container: HTMLElement) {
    cache = createCache({
        key: "css",
        container
    });    
}

export function setOpen(open: boolean) {
    if(open) {
        history.pushState({ open }, "", "?bc-collector");
    } else {
        history.back();
    }
    setState({ open });
}

export default function App() {
    const { open } = useStore(["open"]);

    useEffect(() => {
        function onPopState(e: Event) {
            console.log("History pop state", e);
            //@ts-expect-error
            const historyStateOpen = e.state?.open ?? false;
            console.log("History state open", historyStateOpen);
            console.log("Open", open);
            if(historyStateOpen !== open) {
                console.log("Setting state to", historyStateOpen);
                setState({ open: historyStateOpen });
            }
        }

        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, [open]);

    useEffect(() => {
        if(location.search === "?bc-collector") {
            setState({ open: true });
        }
    }, []);

    return (
        <CacheProvider value={cache}>
            <Zoom
                in={!open}
                unmountOnExit
            >
                <Fab color="primary" style={{
                    position: "fixed",
                    bottom: 16,
                    right: 16,
                    zIndex: 1400 // above the modal
                }} onClick={() => setOpen(true)}>
                    <LibraryMusicIcon />
                </Fab>
            </Zoom>
            <AppDialog />
        </CacheProvider>
    )
}